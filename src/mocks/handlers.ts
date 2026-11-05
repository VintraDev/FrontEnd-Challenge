import { http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import Decimal from 'decimal.js'
import { catalog } from './fixtures/catalog'
import { editionsFor } from './fixtures/editions'
import { cartHandlers } from './cart-handlers'

const socket = ws.link('/')
export const handlers = [
  ...cartHandlers,
  http.get('/api/nfts', ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = (params.get('q') ?? '').trim().toLocaleLowerCase()
    const categories = (params.get('categories') ?? '').split(',').filter(Boolean)
    const network = params.get('network') ?? ''
    const minPrice = params.get('minPrice') ?? ''
    const maxPrice = params.get('maxPrice') ?? ''
    const validPrice = (value: string) => /^\d+(\.\d+)?$/.test(value)
    const sort = params.get('sort')
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
    const items = catalog.filter((nft) => (!q || nft.title.toLocaleLowerCase().includes(q)) && (!categories.length || categories.includes(nft.category)) && (!network || nft.network === network) && (!validPrice(minPrice) || new Decimal(nft.priceEth).gte(minPrice)) && (!validPrice(maxPrice) || new Decimal(nft.priceEth).lte(maxPrice)))
    if (sort === 'price-asc') items.sort((a, b) => new Decimal(a.priceEth).comparedTo(b.priceEth))
    if (sort === 'price-desc') items.sort((a, b) => new Decimal(b.priceEth).comparedTo(a.priceEth))
    return HttpResponse.json({ items: items.slice((page - 1) * 9, page * 9), total: items.length, page, totalPages: Math.ceil(items.length / 9) })
  }),
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = catalog.find((item) => item.id === params.id)
    if (!nft) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'NFT não encontrado.' } }, { status: 404 })
    return HttpResponse.json({ ...nft, description: `Um colecionável digital fictício da coleção Kurio, disponível na rede ${nft.network}.`, editions: editionsFor(nft)  })
  }),
  http.get('/api/health', () => HttpResponse.json({ status: 'ok', source: 'msw' })),
  socket.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    io.client.on('probe', () => {
      io.client.emit('nft.updated', { eventId: 'probe-nft', resourceId: 'nft-1', version: 1 })
      io.client.emit('order.updated', { eventId: 'probe-order', resourceId: 'order-1', version: 1 })
    })
  }),
]
