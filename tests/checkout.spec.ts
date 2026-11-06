import { expect, test } from '@playwright/test';

test('revisão de pagamento usa carrinho e cotação reais e não confirma pedido', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await page.getByRole('link', { name: 'Ver carrinho' }).click();
  await page.getByLabel('Código promocional').fill('KURIO10');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(
    page.getByText('1.087 ETH', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  const review = page.getByRole('link', { name: 'Revisar pagamento' });
  await expect(review).toHaveCSS('color', 'rgb(20, 13, 10)');
  await expect(review).toHaveCSS('background-color', 'rgb(232, 155, 85)');
  await review.click();
  await expect(page).toHaveURL(/\/login\?redirect/);
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeVisible();
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.getByText('Emerald Ape #042')).toBeVisible();
  await expect(page.getByText('Cupom aplicado: KURIO10')).toBeVisible();
  await expect(
    page.getByText('1.087 ETH', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeDisabled();
  await page.getByLabel('Nome de exibição').fill('Colecionador');
  await expect(page.getByText(/dados preenchidos não são salvos/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('1.087 ETH', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Nome de exibição')).toBeEmpty();
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042'),
  ).toBeVisible();
});

test('checkout com carrinho vazio não exibe confirmação', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Explorar NFTs' })).toBeVisible();
});
