import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { registrationSchema } from '@/contracts/auth'
import { passwordInputSchema, profileInputSchema, type Profile } from '@/contracts/profile'

const users = [
  { id: 'collector-a', name: 'Ana Colecionadora', email: 'ana@kurio.test', passwordHash: 'a68b3fedf7b2746c8e2a77e1004527a3793b93b213361ce312dded62ed6c5ec8' },
  { id: 'collector-b', name: 'Bruno Colecionador', email: 'bruno@kurio.test', passwordHash: '07e5edac20d530e8f64004cddfed22bd5a111db9d034ab8b539419ad80d03df4' },
]
type StoredSession = { token: string; user: { id: string; name: string; email: string }; expiresAt: number }
const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('kurio-mock-auth', 3)
  request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('sessions')) request.result.createObjectStore('sessions'); if (!request.result.objectStoreNames.contains('users')) request.result.createObjectStore('users'); if (!request.result.objectStoreNames.contains('profiles')) request.result.createObjectStore('profiles') }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})
export async function resetAuth(): Promise<void> {
  const db = await open()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'users', 'profiles'], 'readwrite')
      for (const store of ['sessions', 'users', 'profiles']) tx.objectStore(store).clear()
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally { db.close() }
}
async function access<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>, storeName = 'sessions'): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const request = action(tx.objectStore(storeName))
    tx.oncomplete = () => { db.close(); resolve(request.result) }
    tx.onerror = () => { db.close(); reject(request.error ?? tx.error) }
    tx.onabort = () => { db.close(); reject(request.error ?? tx.error) }
  })
}
const error = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status })
const tokenFrom = (request: Request) => request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
export async function sessionFrom(request: Request) {
  const token = tokenFrom(request)
  if (!token) return null
  const session = await access<StoredSession | undefined>('readonly', (store) => store.get(token))
  if (!session || session.expiresAt <= Date.now()) { if (session) await access('readwrite', (store) => store.delete(token)); return null }
  return session
}
type RegisteredUser = { id: string; name: string; email: string; passwordHash: string; salt: string }
const derive = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, key, 256)
  return Array.from(new Uint8Array(bits), (n) => n.toString(16).padStart(2, '0')).join('')
}
const hash = async (password: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))), (n) => n.toString(16).padStart(2, '0')).join('')
export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    try {
      const input = registrationSchema.safeParse(await request.json())
      if (!input.success) return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Confira os campos informados.', fieldErrors: input.error.flatten().fieldErrors } }, { status: 422 })
      const { name, email, password } = input.data
      if (users.some((user) => user.email === email)) return error(409, 'ACCOUNT_EXISTS', 'Este e-mail já está cadastrado. Entre na sua conta.')
      const salt = crypto.randomUUID()
      const user: RegisteredUser = { id: crypto.randomUUID(), name, email, salt, passwordHash: await derive(password, salt) }
      const previousToken = tokenFrom(request)
      const token = crypto.randomUUID()
      const session = { token, user: { id: user.id, name: user.name, email: user.email }, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
      const db = await open()
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(['users', 'sessions'], 'readwrite')
          const add = tx.objectStore('users').add(user, email)
          tx.objectStore('sessions').put(session, token)
          if (previousToken) tx.objectStore('sessions').delete(previousToken)
          tx.oncomplete = () => resolve()
          tx.onabort = () => reject(add.error ?? tx.error)
          tx.onerror = () => reject(add.error ?? tx.error)
        })
      } catch (err) { if (err instanceof DOMException && err.name === 'ConstraintError') return error(409, 'ACCOUNT_EXISTS', 'Este e-mail já está cadastrado. Entre na sua conta.'); throw err }
      finally { db.close() }
      return HttpResponse.json(session, { status: 201 })
    } catch { return error(500, 'AUTH_ERROR', 'Não foi possível criar a conta.') }
  }),
  http.post('/api/auth/login', async ({ request }) => {
    try {
      const input = z.object({ email: z.email(), password: z.string().min(1) }).safeParse(await request.json())
      if (!input.success) return error(422, 'VALIDATION_ERROR', 'Informe e-mail e senha válidos.')
      const email = input.data.email.toLowerCase().trim()
      const user = await access<RegisteredUser | undefined>('readonly', (store) => store.get(email), 'users') ?? users.find((candidate) => candidate.email === email)
      const salt = user && 'salt' in user && typeof user.salt === 'string' ? user.salt : undefined
      if (!user || (salt ? await derive(input.data.password, salt) : await hash(input.data.password)) !== user.passwordHash) return error(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
      const previousToken = tokenFrom(request)
      const token = crypto.randomUUID()
      const savedProfile = await access<Profile | undefined>('readonly', (store) => store.get(user.id), 'profiles')
      const session = { token, user: { id: user.id, name: savedProfile?.displayName ?? user.name, email: user.email }, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
      await access('readwrite', (store) => store.put(session, token))
      if (previousToken && previousToken !== token) await access('readwrite', (store) => store.delete(previousToken))
      return HttpResponse.json(session)
    } catch { return error(500, 'AUTH_ERROR', 'Não foi possível iniciar a sessão.') }
  }),
  http.get('/api/auth/session', async ({ request }) => {
    try { const session = await sessionFrom(request); if (!session) return error(401, 'SESSION_EXPIRED', 'Sessão ausente ou expirada.'); const profile = await access<Profile | undefined>('readonly', (store) => store.get(session.user.id), 'profiles'); return HttpResponse.json({ user: { ...session.user, name: profile?.displayName ?? session.user.name }, expiresAt: session.expiresAt }) }
    catch { return error(500, 'AUTH_ERROR', 'Não foi possível consultar a sessão.') }
  }),
  http.get('/api/profile', async ({ request }) => {
    try {
      const session = await sessionFrom(request)
      if (!session) return error(401, 'SESSION_EXPIRED', 'Sessão ausente ou expirada.')
      const profile = await access<Profile | undefined>('readonly', (store) => store.get(session.user.id), 'profiles')
      return HttpResponse.json(profile ?? { displayName: session.user.name, username: session.user.name, email: session.user.email, ens: '', walletNickname: '', avatar: null })
    } catch { return error(500, 'PROFILE_ERROR', 'Não foi possível carregar o perfil.') }
  }),
  http.patch('/api/profile', async ({ request }) => {
    try {
      const session = await sessionFrom(request)
      if (!session) return error(401, 'SESSION_EXPIRED', 'Sessão ausente ou expirada.')
      const input = profileInputSchema.safeParse(await request.json())
      if (!input.success) return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Confira os campos informados.', fieldErrors: input.error.flatten().fieldErrors } }, { status: 422 })
      const profile = { ...input.data, email: session.user.email }
      await access('readwrite', (store) => store.put(profile, session.user.id), 'profiles')
      return HttpResponse.json(profile)
    } catch { return error(500, 'PROFILE_ERROR', 'Não foi possível salvar o perfil.') }
  }),
  http.post('/api/profile/password', async ({ request }) => {
    try {
      const session = await sessionFrom(request)
      if (!session) return error(401, 'SESSION_EXPIRED', 'Sessão ausente ou expirada.')
      const input = passwordInputSchema.safeParse(await request.json())
      if (!input.success) return error(422, 'VALIDATION_ERROR', 'Informe a senha atual e uma nova senha com pelo menos 8 caracteres.')
      const email = session.user.email
      const user = await access<RegisteredUser | undefined>('readonly', (store) => store.get(email), 'users') ?? users.find((candidate) => candidate.email === email)
      const oldSalt = user && 'salt' in user && typeof user.salt === 'string' ? user.salt : undefined
      if (!user || (oldSalt ? await derive(input.data.currentPassword, oldSalt) : await hash(input.data.currentPassword)) !== user.passwordHash) return error(422, 'INVALID_PASSWORD', 'Senha atual incorreta.')
      const salt = crypto.randomUUID()
      const updated = { ...user, salt, passwordHash: await derive(input.data.newPassword, salt) }
      await access('readwrite', (store) => store.put(updated, email), 'users')
      return new HttpResponse(null, { status: 204 })
    } catch { return error(500, 'PROFILE_ERROR', 'Não foi possível alterar a senha.') }
  }),
  http.post('/api/auth/logout', async ({ request }) => {
    try { const token = tokenFrom(request); if (token) await access('readwrite', (store) => store.delete(token)); return new HttpResponse(null, { status: 204 }) }
    catch { return error(500, 'AUTH_ERROR', 'Não foi possível encerrar a sessão.') }
  }),
]
