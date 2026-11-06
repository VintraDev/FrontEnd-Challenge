import { expect, test } from '@playwright/test';

type QuoteResponse = {
  id: string;
  version: string;
  quoteHash: string;
  expiresAt: string;
  cartVersion: number;
  walletId: string | null;
  network: 'Ethereum' | 'Polygon' | null;
  coupon: string | null;
  items: Array<{
    nftId: string;
    editionId: string;
    quantity: number;
    unitPriceEth: string;
    available: number;
  }>;
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
};

test('cotação de confirmação é vinculada à carteira/rede e exige nova revisão quando muda', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/checkout');
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);

  const api = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio-demo-session')!;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const wallet = await (
      await fetch('/api/wallets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          displayName: 'Ana Cotação',
          label: 'Carteira de cotação',
          network: 'Ethereum',
          profileName: 'ana_quote',
          address: '0x1111111111111111111111111111111111111111',
          secondaryAddress: '',
          walletType: 'MetaMask',
          referralCode: 'KURIO',
          email: 'ana@kurio.test',
          ens: 'ana-quote.eth',
          isPrimary: true,
        }),
      })
    ).json();
    await fetch(`/api/wallets/${wallet.id}/connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'connect', network: 'Ethereum', walletType: 'MetaMask' }),
    });
    const added = await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: 'nft-1', editionId: 'ten', quantity: 1 }),
    });
    const cart = await (await fetch('/api/cart', { headers })).json();
    const quoteResponse = await fetch('/api/quotes', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cartVersion: cart.version,
        walletId: wallet.id,
        network: 'Ethereum',
      }),
    });
    await fetch(`/api/wallets/${wallet.id}/connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'select', network: 'Polygon', walletType: 'MetaMask' }),
    });
    const polygonQuoteResponse = await fetch('/api/quotes', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cartVersion: cart.version,
        walletId: wallet.id,
        network: 'Polygon',
      }),
    });
    await fetch(`/api/wallets/${wallet.id}/connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'select', network: 'Ethereum', walletType: 'MetaMask' }),
    });
    const incompleteContext = await fetch('/api/quotes', {
      method: 'POST',
      headers,
      body: JSON.stringify({ cartVersion: cart.version, walletId: wallet.id }),
    });
    return {
      addedStatus: added.status,
      quoteStatus: quoteResponse.status,
      quote: (await quoteResponse.json()) as QuoteResponse,
      polygonQuoteStatus: polygonQuoteResponse.status,
      polygonQuote: (await polygonQuoteResponse.json()) as QuoteResponse,
      incompleteContextStatus: incompleteContext.status,
    };
  });

  expect(api.addedStatus).toBe(201);
  expect(api.quoteStatus).toBe(200);
  expect(api.polygonQuoteStatus).toBe(200);
  expect(api.incompleteContextStatus).toBe(422);
  expect(api.quote).toMatchObject({
    cartVersion: expect.any(Number),
    walletId: expect.any(String),
    network: 'Ethereum',
    coupon: null,
    networkFeeEth: '0.016',
  });
  expect(api.quote.id).toMatch(/^[a-z0-9-]+$/);
  expect(api.quote.version).toMatch(/^cart-\d+-[a-f0-9]{12}$/);
  expect(api.quote.quoteHash).toMatch(/^[a-f0-9]{64}$/);
  expect(Date.parse(api.quote.expiresAt)).toBeGreaterThan(Date.now());
  expect(api.quote.items).toEqual([
    expect.objectContaining({
      nftId: 'nft-1',
      editionId: 'ten',
      quantity: 1,
      unitPriceEth: '1.19',
      available: 2,
    }),
  ]);
  expect(api.polygonQuote).toMatchObject({ network: 'Polygon', networkFeeEth: '0.004' });
  expect(api.polygonQuote.quoteHash).not.toBe(api.quote.quoteHash);

  await page.reload();
  await expect(
    page.locator('.checkout-desktop-wallet [role="status"]', {
      hasText: 'Carteira conectada na rede Ethereum',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Validar dados' }).click();
  await page
    .locator('.checkout-summary')
    .getByRole('button', { name: 'Revalidar cotação' })
    .click();
  await expect(
    page
      .locator('.checkout-summary')
      .getByText('Cotação revisada. Preço, estoque, cupom e rede estão atuais.'),
  ).toBeVisible();
  await expect(page.locator('.checkout-desktop-confirm')).toBeEnabled();

  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'price-changed' }),
    });
  });
  await page.locator('.checkout-desktop-confirm').click();
  await expect(
    page
      .locator('.checkout-summary')
      .getByText('A cotação mudou durante a confirmação. Revise os valores e confirme novamente.'),
  ).toBeVisible();
  await expect(page.locator('.checkout-desktop-confirm')).toBeDisabled();

  const staleStockStatus = await page.evaluate(async (walletId) => {
    const token = localStorage.getItem('kurio-demo-session')!;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers,
      body: JSON.stringify({ catalog: 'out-of-stock' }),
    });
    const cart = await (await fetch('/api/cart', { headers })).json();
    const quote = await fetch('/api/quotes', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cartVersion: cart.version,
        walletId,
        network: 'Ethereum',
      }),
    });
    const body = await quote.json();
    return { status: quote.status, code: body.error?.code };
  }, api.quote.walletId);
  expect(staleStockStatus).toEqual({ status: 409, code: 'QUOTE_STALE' });

  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', quote: 'expired' }),
    });
  });
  await page
    .locator('.checkout-summary')
    .getByRole('button', { name: 'Revalidar cotação' })
    .click();
  await expect(
    page.locator('.checkout-summary').getByText('A cotação retornada já expirou. Tente novamente.'),
  ).toBeVisible();
  await expect(page.locator('.checkout-desktop-confirm')).toBeDisabled();
});
