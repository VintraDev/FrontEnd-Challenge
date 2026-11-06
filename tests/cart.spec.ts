import { expect, test } from '@playwright/test';

test('visitante adiciona, altera, aplica cupom e remove item com persistência', async ({
  page,
}) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await expect(page.getByText('Item adicionado.')).toBeVisible();
  await page.getByRole('link', { name: 'Ver carrinho' }).click();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042'),
  ).toBeVisible();
  await expect(page.getByText('1.206 ETH')).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Aumentar Emerald Ape #042' }).click();
  await expect(page.getByText('2.396 ETH')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aumentar Emerald Ape #042' })).toBeDisabled();
  await page.getByLabel('Código promocional').fill('INVALIDO');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Cupom inválido');
  await page.getByLabel('Código promocional').fill('EXPIRADO');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Cupom expirado');
  await page.getByLabel('Código promocional').fill('KURIO10');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible();
  await expect(page.getByText('2.158 ETH')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible();
  await page.getByRole('button', { name: 'Remover', exact: true }).click();
  await expect(page.getByText('2.396 ETH')).toBeVisible();
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click();
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('API rejeita quantidades inválidas e acima do estoque sem alterar carrinho', async ({
  page,
}) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  const statuses = await page.evaluate(async () => {
    const send = (quantity: number) =>
      fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-1', editionId: 'ten', quantity }),
      });
    return [(await send(1.5)).status, (await send(3)).status];
  });
  expect(statuses).toEqual([422, 409]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});
