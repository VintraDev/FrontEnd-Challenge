import { expect, test } from '@playwright/test'

test('reset restaura fixtures, invalida sessões e limpa perfil e carrinho persistidos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' })).toBeVisible()
  const result = await page.evaluate(async () => {
    const call = async (path: string, method = 'GET', body?: unknown, token?: string) => {
      const response = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
      return { status: response.status, data: response.status === 204 ? null : await response.json() }
    }
    await call('/__test/reset', 'POST')
    const ana = await call('/auth/login', 'POST', { email: 'ana@kurio.test', password: 'KurioDemo123!' })
    const bruno = await call('/auth/login', 'POST', { email: 'bruno@kurio.test', password: 'KurioDemo456!' })
    const profile = { displayName: 'Ana Modificada', username: 'ana', ens: '', walletNickname: '', avatar: null }
    const changed = await call('/profile', 'PATCH', profile, ana.data.token)
    const other = await call('/profile', 'GET', undefined, bruno.data.token)
    const cart = await call('/cart/items', 'POST', { nftId: 'nft-1', editionId: 'ten', quantity: 1 })
    const registered = await call('/auth/register', 'POST', { name: 'Teste Cadastro', email: 'reset@kurio.test', password: 'abcdefgh' })
    return { ana, bruno, changed, other, cart, registered }
  })
  expect(result.ana.status).toBe(200)
  expect(result.bruno.status).toBe(200)
  expect(result.changed.data.displayName).toBe('Ana Modificada')
  expect(result.other.data.displayName).toBe('Bruno Colecionador')
  expect(result.cart.data.lines).toHaveLength(1)
  expect(result.registered.status).toBe(201)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' })).toBeVisible()
  const afterRefresh = await page.evaluate(async ({ token }) => {
    const headers = { Authorization: `Bearer ${token}` }
    return { profile: await (await fetch('/api/profile', { headers })).json(), cart: await (await fetch('/api/cart')).json() }
  }, { token: result.ana.data.token })
  expect(afterRefresh.profile.displayName).toBe('Ana Modificada')
  expect(afterRefresh.cart.lines).toHaveLength(1)
  const resetResult = await page.evaluate(async ({ token }) => {
    const reset = await fetch('/api/__test/reset', { method: 'POST' })
    const session = await fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } })
    const cart = await (await fetch('/api/cart')).json()
    const login = (email: string, password: string) => fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const ana = await (await login('ana@kurio.test', 'KurioDemo123!')).json()
    const profile = await (await fetch('/api/profile', { headers: { Authorization: `Bearer ${ana.token}` } })).json()
    const removedUser = await login('reset@kurio.test', 'abcdefgh')
    const secondReset = await fetch('/api/__test/reset', { method: 'POST' })
    return { reset: reset.status, session: session.status, cart, profile, removedUser: removedUser.status, secondReset: secondReset.status }
  }, { token: result.ana.data.token })
  expect(resetResult.reset).toBe(204)
  expect(resetResult.session).toBe(401)
  expect(resetResult.cart).toEqual({ version: 0, coupon: null, lines: [] })
  expect(resetResult.profile.displayName).toBe('Ana Colecionadora')
  expect(resetResult.removedUser).toBe(401)
  expect(resetResult.secondReset).toBe(204)
})
