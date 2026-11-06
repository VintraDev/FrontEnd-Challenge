import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import Decimal from 'decimal.js'
import { catalogSnapshot } from './scenarios/catalog'
import { editionsFor } from './fixtures/editions'
import { changeCart, readCart, type CartRecord } from './db/cart'

class CartError extends Error { constructor(public status: number, message: string) { super(message) } }
const fail = (error: unknown) => error instanceof CartError ? HttpResponse.json({ error: { code: 'CART_ERROR', message: error.message } }, { status: error.status }) : HttpResponse.json({ error: { code: 'STORE_ERROR', message: 'Não foi possível acessar o carrinho.' } }, { status: 500 })
const lineInput = z.object({ nftId: z.string(), editionId: z.string(), quantity: z.number().int().positive() })
const quantityInput = z.object({ quantity: z.number().int().positive() })
function editionFor(nftId: string, editionId: string) {
  const nft = catalogSnapshot().find((item) => item.id === nftId)
  const edition = nft && editionsFor(nft).find((item) => item.id === editionId)
  if (!nft || !edition) throw new CartError(404, 'NFT ou edição não encontrado.')
  return { nft, edition }
}
function materialize(cart: CartRecord) {
  return { ...cart, lines: cart.lines.map((line) => {
    const { nft, edition } = editionFor(line.nftId, line.editionId)
    return { ...line, title: nft.title, image: nft.image, editionLabel: edition.label, available: edition.available, priceEth: edition.priceEth, lineTotalEth: new Decimal(edition.priceEth).mul(line.quantity).toString() }
  }) }
}
export const cartHandlers = [
  http.get('/api/cart', async () => { try { return HttpResponse.json(materialize(await readCart())) } catch (error) { return fail(error) } }),
  http.post('/api/cart/items', async ({ request }) => { try {
    const input = lineInput.safeParse(await request.json())
    if (!input.success) throw new CartError(422, 'Informe uma quantidade inteira válida.')
    const { nftId, editionId, quantity } = input.data
    const { edition } = editionFor(nftId, editionId)
    const cart = await changeCart((current) => {
      const existing = current.lines.find((line) => line.nftId === nftId && line.editionId === editionId)
      const nextQuantity = (existing?.quantity ?? 0) + quantity
      if (nextQuantity > edition.available) throw new CartError(409, 'Quantidade indisponível para esta edição.')
      const lines = existing ? current.lines.map((line) => line.id === existing.id ? { ...line, quantity: nextQuantity } : line) : [...current.lines, { id: crypto.randomUUID(), nftId, editionId, quantity }]
      return { ...current, version: current.version + 1, lines }
    })
    return HttpResponse.json(materialize(cart), { status: 201 })
  } catch (error) { return fail(error) } }),
  http.patch('/api/cart/items/:id', async ({ request, params }) => { try {
    const input = quantityInput.safeParse(await request.json())
    if (!input.success) throw new CartError(422, 'Informe uma quantidade inteira válida.')
    const cart = await changeCart((current) => {
      const line = current.lines.find((item) => item.id === params.id)
      if (!line) throw new CartError(404, 'Item não encontrado.')
      if (input.data.quantity > editionFor(line.nftId, line.editionId).edition.available) throw new CartError(409, 'Quantidade indisponível para esta edição.')
      return { ...current, version: current.version + 1, lines: current.lines.map((item) => item.id === line.id ? { ...item, quantity: input.data.quantity } : item) }
    })
    return HttpResponse.json(materialize(cart))
  } catch (error) { return fail(error) } }),
  http.delete('/api/cart/items/:id', async ({ params }) => { try {
    const cart = await changeCart((current) => {
      if (!current.lines.some((line) => line.id === params.id)) throw new CartError(404, 'Item não encontrado.')
      return { ...current, version: current.version + 1, lines: current.lines.filter((line) => line.id !== params.id) }
    })
    return HttpResponse.json(materialize(cart))
  } catch (error) { return fail(error) } }),
  http.post('/api/cart/coupon', async ({ request }) => { try {
    const input = z.object({ code: z.string().trim().min(1) }).safeParse(await request.json())
    if (!input.success) throw new CartError(422, 'Informe o código promocional.')
    const code = input.data.code.toUpperCase()
    if (code === 'EXPIRADO') throw new CartError(422, 'Cupom expirado.')
    if (code !== 'KURIO10') throw new CartError(422, 'Cupom inválido.')
    return HttpResponse.json(materialize(await changeCart((cart) => ({ ...cart, coupon: code, version: cart.version + 1 }))))
  } catch (error) { return fail(error) } }),
  http.delete('/api/cart/coupon', async () => { try { return HttpResponse.json(materialize(await changeCart((cart) => ({ ...cart, coupon: null, version: cart.version + 1 })))) } catch (error) { return fail(error) } }),
  http.post('/api/quotes', async ({ request }) => { try {
    const input = z.object({ cartVersion: z.number().int().nonnegative() }).safeParse(await request.json())
    if (!input.success) throw new CartError(422, 'Versão de carrinho inválida.')
    const cart = materialize(await readCart())
    if (cart.version !== input.data.cartVersion) throw new CartError(409, 'O carrinho mudou. Atualize a cotação.')
    const subtotal = cart.lines.reduce((sum, line) => sum.plus(line.lineTotalEth), new Decimal(0))
    const discount = cart.coupon === 'KURIO10' ? subtotal.mul('0.1') : new Decimal(0)
    const fee = cart.lines.length ? new Decimal('0.016') : new Decimal(0)
    return HttpResponse.json({ cartVersion: cart.version, subtotalEth: subtotal.toString(), discountEth: discount.toString(), networkFeeEth: fee.toString(), totalEth: subtotal.minus(discount).plus(fee).toString() })
  } catch (error) { return fail(error) } }),
]
