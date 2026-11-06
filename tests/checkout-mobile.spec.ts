import { expect, test } from '@playwright/test';

for (const width of [320, 390, 414]) {
  test(`prévia de pagamento mobile mantém cotação e acesso à revisão em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 896 });
    await page.goto('/nft/nft-1');
    await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
    await page.getByRole('link', { name: 'Ver carrinho' }).click();
    await page.getByRole('link', { name: 'Revisar pagamento' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('E-mail').fill('ana@kurio.test');
    await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible();
    await expect(page.getByText('Nenhuma carteira conectada')).toBeVisible();
    await expect(page.getByText('1.206 ETH').first()).toBeVisible();
    await expect(page.getByRole('radio', { name: 'MetaMask' })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Confirmar compra', exact: true, visible: true }),
    ).toBeDisabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    if (width === 414)
      await page.screenshot({ path: '/tmp/kurio-checkout-mobile.png', fullPage: true });
    const review = page.getByRole('button', { name: 'Revisar dados e NFTs' });
    await review.click();
    await expect(page.getByRole('button', { name: 'Ocultar dados da revisão' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.getByLabel('Nome de exibição')).toBeVisible();
    await expect(page.getByText('Emerald Ape #042')).toBeVisible();
    await page.getByRole('link', { name: 'Voltar ao carrinho', exact: true }).first().click();
    await expect(page).toHaveURL(/\/cart$/);
  });
}
