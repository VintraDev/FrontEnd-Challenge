import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('E-mail').fill(email);
  await dialog.getByLabel('Senha', { exact: true }).fill(password);
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog).toBeHidden();
}

test('pedidos simulados exigem sessão, preservam snapshot e isolam proprietários', async ({
  page,
}) => {
  await page.goto('/orders/order-demo-a');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(await page.evaluate(async () => (await fetch('/api/orders/order-demo-a')).status)).toBe(
    401,
  );
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible();
  await expect(page.getByText('Dados de demonstração da conta.')).toBeVisible();
  await expect(page.getByText('1.206 ETH', { exact: true })).toBeVisible();
  const receipt = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio-demo-session')!;
    const headers = { Authorization: `Bearer ${token}` };
    const byKey = await fetch('/api/orders/by-key/demo-attempt-a', { headers });
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'price-changed' }),
    });
    return { status: byKey.status, data: await byKey.json() };
  });
  expect(receipt.status).toBe(200);
  expect(receipt.data.receipt.items[0].unitPriceEth).toBe('1.19');
  await page.reload();
  await expect(page.getByText('Quantidade: 1 · 1.19 ETH', { exact: true })).toBeVisible();
  await expect(page.getByText('1.206 ETH', { exact: true })).toBeVisible();
  await page.goto('/account');
  await page
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair' })
    .click();
  await login(page, 'bruno@kurio.test', 'KurioDemo456!');
  await page.goto('/orders/order-demo-a');
  await expect(page.getByRole('heading', { name: 'Pedido indisponível' })).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const token = localStorage.getItem('kurio-demo-session')!;
      return (
        await fetch('/api/orders/order-demo-a', { headers: { Authorization: `Bearer ${token}` } })
      ).status;
    }),
  ).toBe(404);
  await page.goto('/orders/order-demo-b');
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible();
  await expect(page.getByText('Detalhes da transação')).toHaveCount(0);
});
