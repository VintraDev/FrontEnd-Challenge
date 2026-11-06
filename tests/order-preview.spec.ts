import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`prévia do comprovante identifica a simulação em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/orders/preview');
    await expect(
      page.getByRole('heading', { name: 'Prévia da confirmação de pedido' }),
    ).toBeVisible();
    await expect(
      page.getByText('Dados demonstrativos. Nenhuma compra foi realizada.'),
    ).toBeVisible();
    await expect(page.getByText('Emerald Ape #042')).toBeVisible();
    await expect(page.getByText('26.846 ETH').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver no Etherscan' })).toBeDisabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    if (width === 1440)
      await page.screenshot({ path: '/tmp/kurio-order-preview.png', fullPage: true });
    await page.getByRole('link', { name: 'Fechar prévia e voltar ao pagamento' }).click();
    await expect(page).toHaveURL(/\/login\?redirect/);
  });
}

test('pedido real não apresenta confirmação sem fluxo implementado', async ({ page }) => {
  await page.goto('/orders/order-123');
  await expect(page.getByRole('heading', { name: 'Pedido indisponível' })).toBeVisible();
  await expect(page.getByText('Nenhuma compra foi realizada.')).toHaveCount(0);
  await expect(page.getByText('Detalhes da transação')).toHaveCount(0);
});
