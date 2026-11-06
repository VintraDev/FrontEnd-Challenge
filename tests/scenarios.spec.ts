import { expect, test } from '@playwright/test'

test('cenários de catálogo são reproduzíveis, persistem no refresh e resetam', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' })).toBeVisible()
  const outcomes = await page.evaluate(async () => {
    const select = (catalog: string) => fetch('/api/__test/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ catalog }) })
    const catalog = () => fetch('/api/nfts?page=2')
    const invalid = await select('unknown')
    await select('http-404')
    const notFound = await catalog()
    await select('http-500')
    const serverError = await catalog()
    await select('network-error')
    let networkError = false
    try { await catalog() } catch { networkError = true }
    await select('slow')
    const start = performance.now()
    const slow = await catalog()
    const duration = performance.now() - start
    await select('empty')
    const empty = await (await catalog()).json()
    return { invalid: invalid.status, notFound: notFound.status, serverError: serverError.status, networkError, slow: slow.status, duration, empty }
  })
  expect(outcomes).toMatchObject({ invalid: 422, notFound: 404, serverError: 500, networkError: true, slow: 200, empty: { items: [], total: 0, page: 2, totalPages: 0 } })
  expect(outcomes.duration).toBeGreaterThanOrEqual(1100)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' })).toBeVisible()
  const restored = await page.evaluate(async () => {
    const empty = await (await fetch('/api/nfts')).json()
    const reset = await fetch('/api/__test/reset', { method: 'POST' })
    const normal = await (await fetch('/api/nfts')).json()
    return { empty, reset: reset.status, normal }
  })
  expect(restored.empty.total).toBe(0)
  expect(restored.reset).toBe(204)
  expect(restored.normal.total).toBeGreaterThan(0)
})

test('alterações de preço e estoque são consistentes entre catálogo, detalhe e carrinho', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' })).toBeVisible()
  const result = await page.evaluate(async () => {
    const post = (path: string, body?: unknown) => fetch(`/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    await post('/__test/reset')
    const added = await post('/cart/items', { nftId: 'nft-1', editionId: 'ten', quantity: 1 })
    await post('/__test/scenario', { catalog: 'price-changed' })
    const listing = await (await fetch('/api/nfts')).json()
    const detail = await (await fetch('/api/nfts/nft-1')).json()
    const cart = await (await fetch('/api/cart')).json()
    const quote = await (await post('/quotes', { cartVersion: cart.version })).json()
    await post('/__test/scenario', { catalog: 'out-of-stock' })
    const soldOutDetail = await (await fetch('/api/nfts/nft-1')).json()
    const soldOutCart = await (await fetch('/api/cart')).json()
    const rejected = await post('/cart/items', { nftId: 'nft-1', editionId: 'ten', quantity: 1 })
    await post('/__test/reset')
    const original = await (await fetch('/api/nfts/nft-1')).json()
    return { added: added.status, listing, detail, cart, quote, soldOutDetail, soldOutCart, rejected: rejected.status, original }
  })
  expect(result.added).toBe(201)
  expect(result.listing.items[0].priceEth).toBe('1.69')
  expect(result.detail.editions.find((edition: { id: string }) => edition.id === 'ten').priceEth).toBe('1.69')
  expect(result.cart.lines[0].priceEth).toBe('1.69')
  expect(result.quote.subtotalEth).toBe('1.69')
  expect(result.soldOutDetail.editions.every((edition: { available: number }) => edition.available === 0)).toBe(true)
  expect(result.soldOutCart.lines[0].available).toBe(0)
  expect(result.rejected).toBe(409)
  expect(result.original.priceEth).toBe('1.19')
  expect(result.original.editions.find((edition: { id: string }) => edition.id === 'ten').available).toBe(2)
})
