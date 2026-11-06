import { expect, test } from '@playwright/test';

test('pedido idempotente confirma uma vez, debita apenas itens comprados, preserva snapshot e respeita estados terminais', async ({
  page,
}) => {
  await page.goto('/checkout');
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  const result = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio-demo-session')!;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const wallet = await (
      await fetch('/api/wallets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          displayName: 'Ana Pedido',
          label: 'Pedido',
          network: 'Ethereum',
          profileName: 'ana_pedido',
          address: '0x1111111111111111111111111111111111111111',
          secondaryAddress: '',
          walletType: 'MetaMask',
          referralCode: 'KURIO',
          email: 'ana@kurio.test',
          ens: 'ana-pedido.eth',
          isPrimary: true,
        }),
      })
    ).json();
    await fetch(`/api/wallets/${wallet.id}/connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'connect', network: 'Ethereum' }),
    });
    await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: 'nft-1', editionId: 'ten', quantity: 1 }),
    });
    const cart = await (await fetch('/api/cart', { headers })).json();
    const quote = await (
      await fetch('/api/quotes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartVersion: cart.version,
          walletId: wallet.id,
          network: 'Ethereum',
        }),
      })
    ).json();
    const body = {
      quoteId: quote.id,
      walletId: wallet.id,
      network: 'Ethereum',
      acceptedQuoteVersion: quote.version,
      acceptedQuoteHash: quote.quoteHash,
    };
    const key = '11111111-1111-4111-8111-111111111111';
    const first = await fetch('/api/orders', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': key },
      body: JSON.stringify(body),
    });
    const firstOrder = await first.json();

    // Add extra quantity and a second NFT while the order is still pending:
    // only the 1 unit of nft-1 from the quote should be debited upon confirmation.
    await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: 'nft-1', editionId: 'ten', quantity: 1 }),
    });
    await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: 'nft-2', editionId: 'ten', quantity: 1 }),
    });
    const pendingCart = await (await fetch('/api/cart', { headers })).json();

    const same = await (
      await fetch('/api/orders', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': key },
        body: JSON.stringify(body),
      })
    ).json();
    const conflictResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': key },
      body: JSON.stringify({ ...body, network: 'Polygon' }),
    });
    const conflictBody = await conflictResponse.json();

    await new Promise((resolve) => setTimeout(resolve, 450));
    const confirmed = await (await fetch(`/api/orders/${firstOrder.id}`, { headers })).json();
    // Querying again after confirmation must not debit the cart a second time
    // and must remain terminal even if scenario changes to decline/price-changed.
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'price-changed', orders: 'decline' }),
    });
    const confirmedAgain = await (await fetch(`/api/orders/${firstOrder.id}`, { headers })).json();
    const afterCart = await (await fetch('/api/cart', { headers })).json();

    // Now create a declined order and verify it does not debit the cart and is terminal.
    const secondQuote = await (
      await fetch('/api/quotes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartVersion: afterCart.version,
          walletId: wallet.id,
          network: 'Ethereum',
        }),
      })
    ).json();
    const declineKey = '22222222-2222-4222-8222-222222222222';
    const declinedPending = await (
      await fetch('/api/orders', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': declineKey },
        body: JSON.stringify({
          quoteId: secondQuote.id,
          walletId: wallet.id,
          network: 'Ethereum',
          acceptedQuoteVersion: secondQuote.version,
          acceptedQuoteHash: secondQuote.quoteHash,
        }),
      })
    ).json();
    await new Promise((resolve) => setTimeout(resolve, 450));
    const declinedFinal = await (
      await fetch(`/api/orders/${declinedPending.id}`, { headers })
    ).json();
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', orders: 'default' }),
    });
    const declinedStillTerminal = await (
      await fetch(`/api/orders/${declinedPending.id}`, { headers })
    ).json();
    const cartAfterDecline = await (await fetch('/api/cart', { headers })).json();

    return {
      first: first.status,
      firstOrder,
      pendingCartLines: pendingCart.lines.map((line: { nftId: string; quantity: number }) => ({
        nftId: line.nftId,
        quantity: line.quantity,
      })),
      same,
      conflict: conflictResponse.status,
      conflictCode: conflictBody.error?.code,
      confirmed,
      confirmedAgain,
      afterCartLines: afterCart.lines.map((line: { nftId: string; quantity: number }) => ({
        nftId: line.nftId,
        quantity: line.quantity,
      })),
      declinedFinal,
      declinedStillTerminal,
      cartAfterDeclineLines: cartAfterDecline.lines.map(
        (line: { nftId: string; quantity: number }) => ({
          nftId: line.nftId,
          quantity: line.quantity,
        }),
      ),
    };
  });
  expect(result.first).toBe(201);
  expect(result.firstOrder.status).toBe('pending');
  expect(result.firstOrder.receipt).toBeNull();
  expect(result.pendingCartLines).toEqual([
    { nftId: 'nft-1', quantity: 2 },
    { nftId: 'nft-2', quantity: 1 },
  ]);
  expect(result.same.id).toBe(result.firstOrder.id);
  expect(result.conflict).toBe(409);
  expect(result.conflictCode).toBe('IDEMPOTENCY_CONFLICT');
  expect(result.confirmed.status).toBe('confirmed');
  expect(result.confirmed.receipt.wallet).toContain('MetaMask');
  expect(result.confirmed.receipt.items[0]).toMatchObject({
    title: 'Emerald Ape #042',
    unitPriceEth: '1.19',
    subtotalEth: '1.19',
  });
  expect(result.confirmedAgain.status).toBe('confirmed');
  expect(result.confirmedAgain.version).toBe(result.confirmed.version);
  expect(result.confirmedAgain.receipt).toEqual(result.confirmed.receipt);
  expect(result.afterCartLines).toEqual([
    { nftId: 'nft-1', quantity: 1 },
    { nftId: 'nft-2', quantity: 1 },
  ]);
  expect(result.declinedFinal.status).toBe('declined');
  expect(result.declinedFinal.receipt).toBeNull();
  expect(result.declinedFinal.transactionRef).toBeNull();
  expect(result.declinedStillTerminal.status).toBe('declined');
  expect(result.cartAfterDeclineLines).toEqual([
    { nftId: 'nft-1', quantity: 1 },
    { nftId: 'nft-2', quantity: 1 },
  ]);
});

test('fluxo completo do catálogo ao recibo recupera timeout após commit e clique duplo/refresh não duplicam pedido', async ({
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

  await page.getByRole('link', { name: 'Revisar pagamento' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('E-mail').fill('ana@kurio.test');
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/checkout/);

  await page.getByRole('link', { name: 'Cadastrar carteira' }).click();
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
  await expect(primary.getByRole('status')).toHaveText('Carteira salva.');

  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(
    page.getByText('Carteira conectada na rede Ethereum').filter({ visible: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Validar dados' }).click();
  await expect(page.getByText('Dados do colecionador validados para a revisão.')).toBeVisible();

  await page
    .locator('.checkout-summary')
    .getByRole('button', { name: 'Revalidar cotação' })
    .click();
  await expect(
    page
      .locator('.checkout-summary')
      .getByText('Cotação revisada. Preço, estoque, cupom e rede estão atuais.'),
  ).toBeVisible();

  await page.evaluate(async () => {
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', orders: 'timeout-after-commit' }),
    });
  });

  await page.locator('.checkout-desktop-confirm').dblclick();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible();
  await expect(page.getByText('Detalhes da transação')).toBeVisible();
  await expect(page.getByText('Emerald Ape #042')).toBeVisible();
  await expect(page.getByText('Quantidade: 1 · 1.19 ETH', { exact: true })).toBeVisible();
  await expect(page.getByText('0.119 ETH', { exact: true })).toBeVisible();
  await expect(page.getByText('1.087 ETH', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/MetaMask · Cofre Principal \(ana\.eth\)/).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible();
  await expect(page.getByText('1.087 ETH', { exact: true }).first()).toBeVisible();

  const verification = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio-demo-session')!;
    const headers = { Authorization: `Bearer ${token}` };
    const orders = await (await fetch('/api/orders', { headers })).json();
    const cart = await (await fetch('/api/cart', { headers })).json();
    await fetch('/api/__test/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog: 'default', orders: 'default' }),
    });
    return {
      createdOrdersCount: orders.items.filter(
        (item: { id: string }) => !item.id.startsWith('order-demo-'),
      ).length,
      cartLinesCount: cart.lines.length,
    };
  });
  expect(verification).toEqual({
    createdOrdersCount: 1,
    cartLinesCount: 0,
  });
});
