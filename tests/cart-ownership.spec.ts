import { expect, test } from '@playwright/test';

test('merge visitante é transacional, repetível e os carrinhos são isolados', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  const result = await page.evaluate(async () => {
    const json = { 'Content-Type': 'application/json' };
    const login = async (email: string, password: string) =>
      (
        await (
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: json,
            body: JSON.stringify({ email, password }),
          })
        ).json()
      ).token as string;
    const a = await login('ana@kurio.test', 'KurioDemo123!');
    const b = await login('bruno@kurio.test', 'KurioDemo456!');
    const auth = (token: string) => ({ ...json, Authorization: `Bearer ${token}` });
    const add = (token?: string) =>
      fetch('/api/cart/items', {
        method: 'POST',
        headers: token ? auth(token) : json,
        body: JSON.stringify({ nftId: 'nft-1', editionId: 'ten', quantity: 1 }),
      });
    const cart = async (token?: string) =>
      (await fetch('/api/cart', { headers: token ? auth(token) : {} })).json();
    const merge = (token: string) =>
      fetch('/api/cart/merge', { method: 'POST', headers: auth(token) });
    await add();
    const first = (await merge(a)).status;
    const repeated = (await merge(a)).status;
    const aAfterMerge = await cart(a);
    const bBefore = await cart(b);
    const guestAfterMerge = await cart();
    await add(b);
    await add();
    await add();
    const conflict = (await merge(b)).status;
    const bAfterConflict = await cart(b);
    const guestAfterConflict = await cart();
    const invalid = (await fetch('/api/cart', { headers: auth('invalid') })).status;
    await fetch('/api/__test/reset', { method: 'POST' });
    const newA = await login('ana@kurio.test', 'KurioDemo123!');
    const resetA = await cart(newA);
    const resetGuest = await cart();
    return {
      first,
      repeated,
      aAfterMerge,
      bBefore,
      guestAfterMerge,
      conflict,
      bAfterConflict,
      guestAfterConflict,
      invalid,
      resetA,
      resetGuest,
    };
  });
  expect(result.first).toBe(204);
  expect(result.repeated).toBe(204);
  expect(result.aAfterMerge.lines[0].quantity).toBe(1);
  expect(result.bBefore.lines).toEqual([]);
  expect(result.guestAfterMerge.lines).toEqual([]);
  expect(result.conflict).toBe(409);
  expect(result.bAfterConflict.lines[0].quantity).toBe(1);
  expect(result.guestAfterConflict.lines[0].quantity).toBe(2);
  expect(result.invalid).toBe(401);
  expect(result.resetA.lines).toEqual([]);
  expect(result.resetGuest.lines).toEqual([]);
});

test('login leva o carrinho visitante à conta sem expor o carrinho de outra conta', async ({
  page,
}) => {
  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await expect(page.getByText('Item adicionado.')).toBeVisible();
  await page.goto('/login?redirect=%2Fcart');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('E-mail').fill('ana@kurio.test');
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042'),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042'),
  ).toBeVisible();
});
