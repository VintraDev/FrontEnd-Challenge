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
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeAttached();
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.getByText('Emerald Ape #042')).toBeVisible();
  await expect(page.getByText('Cupom aplicado: KURIO10')).toBeVisible();
  await expect(
    page.getByText('1.087 ETH', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeDisabled();
  await page.getByLabel('Nome de exibição').fill('Colecionador');
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

test('carteira cadastrada aparece no checkout, simula conexão/recusa/desconexão, persiste após refresh e isola contas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await expect(page.getByRole('link', { name: 'Ver carrinho' })).toBeVisible();
  await page.goto('/account/wallets');
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();

  const primary = page.getByRole('form', { name: 'Carteira principal' });
  await primary.getByLabel('Nome de exibição').fill('Ana Colecionadora');
  await primary.getByLabel('Apelido da carteira').fill('Cofre Principal');
  await primary.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Ethereum' }).click();
  await primary.getByLabel('Nome do perfil').fill('ana_profile');
  await primary
    .getByLabel('Endereço da carteira')
    .fill('0x1111111111111111111111111111111111111111');
  await primary.getByRole('combobox', { name: 'Tipo de carteira' }).click();
  await page.getByRole('option', { name: 'MetaMask' }).click();
  await primary.getByLabel('Código de indicação').fill('KURIO');
  await primary.getByLabel('E-mail').fill('ana@kurio.test');
  await primary.getByLabel('Nome ENS').fill('ana.eth');
  await primary.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(page.getByRole('checkbox', { name: 'Igual à carteira principal' })).toBeEnabled();

  await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).check();
  const secondary = page.getByRole('form', { name: 'Carteira secundária' });
  await secondary.getByLabel('Apelido da carteira').fill('Carteira Reserva');
  await secondary.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Polygon' }).click();
  await secondary
    .getByLabel('Endereço da carteira')
    .fill('0x2222222222222222222222222222222222222222');
  await secondary.getByRole('combobox', { name: 'Tipo de carteira' }).click();
  await page.getByRole('option', { name: 'Coinbase Wallet' }).click();
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(page.getByRole('region', { name: 'Conexão da carteira secundária' })).toBeVisible();

  await page.goto('/checkout');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('Cofre Principal');
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
    '0x1111111111111111111111111111111111111111',
  );
  await expect(page.getByText('Ana Colecionadora (Cofre Principal)')).toBeVisible();
  await expect(page.getByText('Carteira desconectada').filter({ visible: true })).toBeVisible();

  await page.getByRole('button', { name: 'Validar dados' }).click();
  await expect(page.getByText('Dados do colecionador validados para a revisão.')).toBeVisible();

  await page.getByRole('button', { name: 'Simular recusa' }).click();
  await expect(
    page.getByText('Conexão recusada', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        'Conexão recusada pela carteira simulada. A compra permanece bloqueada até conectar uma carteira.',
      )
      .filter({ visible: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('Carteira desconectada').filter({ visible: true })).toBeVisible();

  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', wallets: 'reject-connection' }),
    });
  });
  await page.getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(
    page.getByText('Conexão recusada', { exact: true }).filter({ visible: true }),
  ).toBeVisible();

  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', wallets: 'default' }),
    });
  });
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(
    page.getByText('Carteira conectada na rede Ethereum').filter({ visible: true }),
  ).toBeVisible();

  await page.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Polygon' }).click();
  await expect(
    page.getByText('Carteira conectada na rede Polygon').filter({ visible: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora');
  await expect(
    page.getByText('Carteira conectada na rede Polygon').filter({ visible: true }),
  ).toBeVisible();
  await page.screenshot({ path: '/tmp/kurio-checkout-wallets-desktop.png', fullPage: true });

  await page.getByRole('checkbox', { name: /Usar outra carteira\?/ }).check();
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('Carteira Reserva');
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
    '0x2222222222222222222222222222222222222222',
  );
  await expect(page.getByText('Carteira desconectada').filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(
    page.getByText('Carteira conectada na rede Polygon').filter({ visible: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Desconectar carteira' }).click();
  await expect(page.getByText('Carteira desconectada').filter({ visible: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('radiogroup', { name: 'Carteiras cadastradas' })).toBeVisible();
  await page.getByRole('button', { name: 'Trocar carteira' }).click();
  await expect(page.getByRole('radio', { name: 'MetaMask' })).toBeChecked();
  await page.getByRole('radio', { name: 'WalletConnect' }).check();
  await expect(page.getByRole('radio', { name: 'WalletConnect' })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/kurio-checkout-wallets-mobile.png', fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(
    page.getByText('Carteira conectada na rede Polygon').filter({ visible: true }),
  ).toBeVisible();
  await page.goto('/account/wallets');
  await page
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair' })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('E-mail').fill('bruno@kurio.test');
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo456!');
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog).toBeHidden();

  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await expect(page.getByRole('link', { name: 'Ver carrinho' })).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByLabel('Nome de exibição')).toBeEmpty();
  await expect(page.getByText(/Nenhuma carteira cadastrada na sua conta/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeDisabled();

  await page.goto('/account/wallets');
  await page
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair' })
    .click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('E-mail').fill('ana@kurio.test');
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('region', { name: 'Conexão da carteira principal' }).getByRole('status'),
  ).toHaveText('Desconectada');
});
