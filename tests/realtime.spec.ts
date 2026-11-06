import { expect, test } from '@playwright/test';

test('alteração de preço chega ao carrinho pelo Socket.IO e revalida dados REST', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForFunction(async () =>
    (await (await fetch('/api/__test/session-sockets')).json()).users.includes('user-ana'),
  );
  await page.evaluate(async () => {
    const token = localStorage.getItem('kurio-demo-session')!;
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftId: 'nft-1', editionId: 'ten', quantity: 1 }),
    });
  });
  await page.goto('/cart');
  await expect(page.getByText('1.19 ETH', { exact: true }).first()).toBeVisible();

  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'price-changed' }),
    });
  });
  await expect(page.getByText('1.69 ETH', { exact: true }).first()).toBeVisible();

  await page.evaluate(async () => {
    await fetch('/api/__test/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'nft.updated',
        eventId: 'event-old-price',
        resourceId: 'nft-1',
        editionId: 'ten',
        version: 1,
        changedAt: new Date().toISOString(),
        changes: { priceEth: '1.19' },
      }),
    });
  });
  await expect(page.getByText('1.69 ETH', { exact: true }).first()).toBeVisible();
});

test('evento privado de pedido é entregue ao dono e reconcilia seu status', async ({ page }) => {
  await page.goto('/orders/order-demo-b');
  await page.getByLabel('E-mail').fill('bruno@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo456!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible();
  await page.waitForFunction(async () =>
    (await (await fetch('/api/__test/session-sockets')).json()).users.includes('collector-b'),
  );
  await page.evaluate(async () => {
    await fetch('/api/__test/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order.updated',
        eventId: 'order-demo-b-declined',
        resourceId: 'order-demo-b',
        ownerScope: 'collector-b',
        version: 2,
        changedAt: new Date().toISOString(),
        changes: { status: 'declined' },
      }),
    });
  });
  await expect(page.getByRole('heading', { name: 'Pedido recusado' })).toBeVisible();
});
