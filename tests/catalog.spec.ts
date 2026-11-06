import { expect, test } from '@playwright/test';

test('catálogo usa REST e mantém filtros na URL após refresh', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = page.waitForResponse((r) => r.url().includes('/api/nfts'));
  await page.goto('/');
  expect((await response).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Arte digital' }).check();
  await expect(page).toHaveURL(/categories=/);
  await expect(page.getByText('3 resultados')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Arte digital' })).toBeChecked();
  await page.getByLabel('Buscar NFTs').fill('inexistente');
  await expect(page.getByText('Nenhum NFT encontrado para estes filtros.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).first().click();
  await expect(page.getByText('27 resultados')).toBeVisible();
  const minimumPrice = page.getByLabel('Preço mínimo');
  await expect(minimumPrice).toHaveAttribute('type', 'range');
  await minimumPrice.press('ArrowRight');
  await expect(page.getByText('Preço: 0,03 - 12,30 ETH')).toBeVisible();
  await minimumPrice.fill('1.69');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL(/minPrice=%221.69%22/);
  await expect(page).toHaveURL(/maxPrice=%2212.3%22/);
  await expect(page.getByText('12 resultados')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).first().click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('home não apresenta overflow nas larguras principais', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByText('27 resultados')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
