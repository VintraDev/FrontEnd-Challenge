import { expect, test } from '@playwright/test';

for (const width of [320, 390, 414]) {
  test(`detalhe mobile permite selecionar edição e adicionar ao carrinho em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 896 });
    await page.goto('/nft/nft-1');
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao catálogo' })).toBeVisible();
    await page.getByRole('button', { name: '1/50' }).click();
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await expect(page.locator('output')).toHaveText('2');
    await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
    await expect(page.getByText('Item adicionado.')).toBeVisible();
    await page.getByRole('link', { name: 'Abrir carrinho' }).click();
    await expect(
      page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042'),
    ).toBeVisible();
    await expect(page.getByText('2.396 ETH')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('detalhe desktop mantém galeria e controles em colunas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/nft/nft-1');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Entre para favoritar' }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.locator('.detail-thumbnail')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir carrinho' })).toBeHidden();
  const positions = await page
    .locator('.detail-gallery, .detail-info')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
  expect(positions[1]).toBeGreaterThan(positions[0]);
});
