import { expect, test } from '@playwright/test';

test('REST, Socket.IO e nova conexão passam pela rede simulada', async ({ page }) => {
  const health = page.waitForResponse((response) => response.url().endsWith('/api/health'));
  await page.goto('/diagnostics');
  expect((await health).status()).toBe(200);
  await expect(page.getByText('REST: ok (msw)')).toBeVisible();
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('nft.updated, order.updated');
  await page.getByRole('button', { name: 'Reconectar teste' }).click();
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('nft.updated, order.updated');
});

test('rota direta e rota inexistente', async ({ page }) => {
  await page.goto('/nft/nft-1');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.goto('/rota-inexistente');
  await expect(page.getByText('Página não encontrada.')).toBeVisible();
});
