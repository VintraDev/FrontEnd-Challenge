import { expect, test } from '@playwright/test'

async function fillRegistration(page: import('@playwright/test').Page, email: string) {
  await page.getByLabel('Nome de usuário').fill('Colecionadora Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123!')
  await page.getByLabel('Confirmar senha').fill('SenhaFicticia123!')
}

test('cadastro valida, preserva destino e permite novo login após refresh', async ({ page }) => {
  await page.goto('/checkout')
  await page.getByRole('link', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/register\?redirect/)
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Informe um nome com pelo menos 2 caracteres.')).toBeVisible()
  await fillRegistration(page, 'nova@kurio.test')
  await page.getByLabel('Confirmar senha').fill('errada')
  await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('As senhas devem ser iguais.')).toBeVisible()
  await page.getByLabel('Confirmar senha').fill('SenhaFicticia123!')
  await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByText('Colecionadora Teste')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Colecionadora Teste')).toBeVisible()
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login\?redirect/)
  await page.getByLabel('E-mail').fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123!')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByText('Colecionadora Teste')).toBeVisible()
})

test('cadastro duplicado informa conflito e mantém destino para o login', async ({ page }) => {
  await page.goto('/register?redirect=%2Fcheckout')
  await fillRegistration(page, ' ANA@KURIO.TEST ')
  await page.getByRole('dialog').getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Este e-mail já está cadastrado')
  await page.getByRole('dialog').getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/login\?redirect/)
})

test('cadastros concorrentes para o mesmo e-mail geram um único usuário', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByRole('dialog')).toBeVisible()
  const statuses = await page.evaluate(async () => {
    const payload = { name: 'Pessoa Teste', email: 'duplicada@kurio.test', password: 'SenhaFicticia123!' }
    return Promise.all([1, 2].map(async () => (await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).status))
  })
  expect(statuses.sort()).toEqual([201, 409])
})

test('cadastro mobile mantém formulário acessível e rejeita retorno externo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/register?redirect=%2F%2Fevil.example')
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: '/tmp/kurio-register-mobile.png', fullPage: true })
  await fillRegistration(page, 'mobile@kurio.test')
  await page.getByRole('dialog').getByRole('button', { name: 'Criar perfil', exact: true }).click()
  await expect(page).toHaveURL(/\/(?:\?.*)?$/)
})

test('registro migra o banco de sessão existente sem apagar sessões', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('kurio-mock-auth', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('sessions')
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('sessions', 'readwrite')
        tx.objectStore('sessions').put({ token: 'legacy', user: { id: 'legacy', name: 'Legacy', email: 'legacy@kurio.test' }, expiresAt: Date.now() + 3600000 }, 'legacy')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })
  })
  await page.goto('/register')
  await fillRegistration(page, 'migracao@kurio.test')
  await page.getByRole('dialog').getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Colecionadora Teste')).toBeVisible()
  const legacy = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('kurio-mock-auth'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    const result = await new Promise<unknown>((resolve, reject) => { const request = db.transaction('sessions').objectStore('sessions').get('legacy'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    db.close()
    return result
  })
  expect(legacy).toMatchObject({ token: 'legacy' })
})
