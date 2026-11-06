import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('E-mail').fill(email);
  await dialog.getByLabel('Senha', { exact: true }).fill(password);
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
}

async function expireStoredSession(page: Page) {
  await page.evaluate(async () => {
    const token = localStorage.getItem('kurio-demo-session')!;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kurio-mock-auth', 3);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const request = store.get(token);
      request.onsuccess = () => store.put({ ...request.result, expiresAt: 0 }, token);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
}

test('sessão revogada durante operação privada retorna ao login e isola a próxima conta', async ({
  page,
}) => {
  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await expect(page.getByText('Item adicionado.')).toBeVisible();
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  await expireStoredSession(page);
  await page.getByLabel('Nome de exibição').fill('Alteração após expiração');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/account');
  expect(await page.evaluate(() => localStorage.getItem('kurio-demo-session'))).toBeNull();
  await login(page, 'bruno@kurio.test', 'KurioDemo456!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('sessão expira na tela aberta pelo prazo e preserva a rota protegida', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T12:00:00Z') });
  await page.goto('/checkout');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await page.clock.fastForward('24:00:01');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/checkout');
  expect(await page.evaluate(() => localStorage.getItem('kurio-demo-session'))).toBeNull();
});

test('reset encerra a sessão ativa após a reconexão do socket', async ({ page }) => {
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  await expect
    .poll(async () =>
      page.evaluate(
        async () => (await (await fetch('/api/__test/session-sockets')).json()).users as string[],
      ),
    )
    .toContain('collector-a');
  await page.evaluate(async () => {
    await fetch('/api/__test/reset', { method: 'POST' });
  });
  await expect(page).toHaveURL(/\/login\?redirect=/, { timeout: 10000 });
  expect(await page.evaluate(() => localStorage.getItem('kurio-demo-session'))).toBeNull();
});

test('credenciais inválidas em nova tentativa não encerram a sessão existente', async ({
  page,
}) => {
  await page.goto('/login?redirect=%2Faccount');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  const token = await page.evaluate(() => localStorage.getItem('kurio-demo-session'));
  await page.goto('/login');
  await login(page, 'bruno@kurio.test', 'senha-incorreta');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'E-mail ou senha inválidos',
  );
  expect(await page.evaluate(() => localStorage.getItem('kurio-demo-session'))).toBe(token);
  await page.keyboard.press('Escape');
  await expect(page.getByText('Ana Colecionadora')).toBeVisible();
});

test('troca e logout em outra aba limpam os dados privados da sessão anterior', async ({
  context,
  page,
}) => {
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  await page.getByLabel('Nome de exibição').fill('Perfil privado da Ana');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil salvo.');
  const other = await context.newPage();
  await other.goto('/login?redirect=%2Faccount');
  await login(other, 'bruno@kurio.test', 'KurioDemo456!');
  await expect(other.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  await expect
    .poll(() =>
      page
        .locator('input')
        .evaluateAll((nodes) => nodes.some((node) => node.value === 'Perfil privado da Ana')),
    )
    .toBe(false);
  await page.goto('/account');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  await other
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair' })
    .click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.getByLabel('Nome de exibição')).toHaveCount(0);
  await other.close();
});

test('401 atrasado da sessão anterior não encerra conta autenticada em outra aba', async ({
  context,
  page,
}) => {
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  const other = await context.newPage();
  await other.goto('/login?redirect=%2Faccount');
  await expect(other.getByRole('dialog')).toBeVisible();
  await other.getByLabel('E-mail').fill('bruno@kurio.test');
  await other.getByLabel('Senha', { exact: true }).fill('KurioDemo456!');
  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', auth: 'delayed-expired-profile' }),
    });
  });
  await page.bringToFront();
  await page.getByLabel('Nome de exibição').fill('Requisição antiga');
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await (await fetch('/api/__test/session-sockets')).json()).users as string[],
      ),
    )
    .toContain('collector-a');
  await expireStoredSession(page);
  const delayed = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/profile') &&
      response.request().method() === 'PATCH' &&
      response.status() === 401,
  );
  const started = page.waitForRequest(
    (request) => request.url().endsWith('/api/profile') && request.method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await started;
  await other.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(other.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  const currentToken = await other.evaluate(() => localStorage.getItem('kurio-demo-session'));
  expect(currentToken).toBeTruthy();
  await delayed;
  expect(await other.evaluate(() => localStorage.getItem('kurio-demo-session'))).toBe(currentToken);
  await page.goto('/account');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  await other.close();
});

test('socket autenticado é encerrado no logout e substituído na troca de usuário', async ({
  page,
}) => {
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  const users = () =>
    page.evaluate(
      async () => (await (await fetch('/api/__test/session-sockets')).json()).users as string[],
    );
  await expect.poll(users).toEqual(['collector-a']);
  await page
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(users).toEqual([]);
  await login(page, 'bruno@kurio.test', 'KurioDemo456!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  await expect.poll(users).toEqual(['collector-b']);
});
