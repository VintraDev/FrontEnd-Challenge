import { http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

const socket = ws.link('/')
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok', source: 'msw' })),
  socket.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    io.client.on('probe', () => {
      io.client.emit('nft.updated', { eventId: 'probe-nft', resourceId: 'nft-1', version: 1 })
      io.client.emit('order.updated', { eventId: 'probe-order', resourceId: 'order-1', version: 1 })
    })
  }),
]
