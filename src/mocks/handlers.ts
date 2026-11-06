import { http, HttpResponse, ws, type WebSocketHandlerConnection } from 'msw';
import { z } from 'zod';
import { toSocketIo } from '@mswjs/socket.io-binding';
import Decimal from 'decimal.js';
import { editionsFor } from './fixtures/editions';
import { cartHandlers } from './cart-handlers';
import { authHandlers, resetAuth, sessionFrom } from './auth-handlers';
import { resetCarts } from './db/cart';
import { resetFavorites } from './db/favorites';
import { favoriteHandlers } from './favorite-handlers';
import { walletHandlers } from './wallet-handlers';
import { resetWallets } from './db/wallets';
import { declinePendingOrder, readOrders, resetOrders } from './db/orders';
import { resetQuotes } from './db/quotes';
import { orderHandlers } from './order-handlers';
import { receiptPreview } from './fixtures/receipt-preview';
import { realtimeControlSchema } from '@/contracts/events';
import { scenarioSchema } from '@/contracts/scenarios';
import {
  catalogScenarioResponse,
  catalogSnapshot,
  resetScenario,
  setScenario,
} from './scenarios/catalog';

const socket = ws.link('/');
const sessionSockets = new Map<
  string,
  {
    userId: string;
    client: WebSocketHandlerConnection['client'];
    emit: (event: string, payload: unknown) => void;
  }
>();
function emitBusinessEvent(payload: unknown) {
  const event = realtimeControlSchema.safeParse(payload);
  if (!event.success) return false;
  for (const socket of sessionSockets.values()) {
    if (event.data.type === 'order.updated' && socket.userId !== event.data.ownerScope) continue;
    socket.emit(event.data.type, event.data);
  }
  return true;
}
export const handlers = [
  http.post('/api/__test/reset', async () => {
    try {
      await resetAuth();
      for (const { client } of sessionSockets.values()) client.close(1000, 'Cenário restaurado');
      sessionSockets.clear();
      await resetCarts();
      await resetFavorites();
      await resetWallets();
      await resetOrders();
      await resetQuotes();
      resetScenario();
      return new HttpResponse(null, { status: 204 });
    } catch {
      return HttpResponse.json(
        { error: { code: 'STORE_ERROR', message: 'Não foi possível restaurar o cenário.' } },
        { status: 500 },
      );
    }
  }),
  http.post('/api/__test/scenario', async ({ request }) => {
    try {
      const parsed = scenarioSchema.safeParse(await request.json());
      if (!parsed.success)
        return HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Cenário inválido.' } },
          { status: 422 },
        );
      setScenario(parsed.data);
      if (parsed.data.catalog === 'price-changed')
        emitBusinessEvent({
          type: 'nft.updated',
          eventId: crypto.randomUUID(),
          resourceId: 'nft-1',
          editionId: 'ten',
          version: 2,
          changedAt: new Date().toISOString(),
          changes: { priceEth: '1.69' },
        });
      return HttpResponse.json(parsed.data);
    } catch {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cenário inválido.' } },
        { status: 422 },
      );
    }
  }),
  http.post('/api/__test/event', async ({ request }) => {
    const event = realtimeControlSchema.safeParse(await request.json());
    if (!event.success)
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Evento inválido.' } },
        { status: 422 },
      );
    if (event.data.type === 'order.updated') {
      const order = (await readOrders(event.data.ownerScope)).find(
        (item) => item.id === event.data.resourceId,
      );
      if (!order)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Pedido não encontrado.' } },
          { status: 404 },
        );
      if (order.status === 'pending' && event.data.changes.status === 'declined')
        await declinePendingOrder(event.data.resourceId, event.data.ownerScope, event.data.version);
    }
    emitBusinessEvent(event.data);
    return HttpResponse.json(event.data);
  }),
  http.get('/api/__test/session-sockets', () =>
    HttpResponse.json({ users: [...sessionSockets.values()].map(({ userId }) => userId) }),
  ),
  ...authHandlers,
  ...favoriteHandlers,
  ...walletHandlers,
  ...cartHandlers,
  http.get('/api/orders/preview', () => HttpResponse.json(receiptPreview)),
  ...orderHandlers,
  http.get('/api/nfts', async ({ request }) => {
    const scenarioResponse = await catalogScenarioResponse(request);
    if (scenarioResponse) return scenarioResponse;
    const params = new URL(request.url).searchParams;
    const q = (params.get('q') ?? '').trim().toLocaleLowerCase();
    const categories = (params.get('categories') ?? '').split(',').filter(Boolean);
    const network = params.get('network') ?? '';
    const minPrice = params.get('minPrice') ?? '';
    const maxPrice = params.get('maxPrice') ?? '';
    const validPrice = (value: string) => /^\d+(\.\d+)?$/.test(value);
    const sort = params.get('sort');
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
    const items = catalogSnapshot().filter(
      (nft) =>
        (!q || nft.title.toLocaleLowerCase().includes(q)) &&
        (!categories.length || categories.includes(nft.category)) &&
        (!network || nft.network === network) &&
        (!validPrice(minPrice) || new Decimal(nft.priceEth).gte(minPrice)) &&
        (!validPrice(maxPrice) || new Decimal(nft.priceEth).lte(maxPrice)),
    );
    if (sort === 'price-asc') items.sort((a, b) => new Decimal(a.priceEth).comparedTo(b.priceEth));
    if (sort === 'price-desc') items.sort((a, b) => new Decimal(b.priceEth).comparedTo(a.priceEth));
    return HttpResponse.json({
      items: items.slice((page - 1) * 9, page * 9),
      total: items.length,
      page,
      totalPages: Math.ceil(items.length / 9),
    });
  }),
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = catalogSnapshot().find((item) => item.id === params.id);
    if (!nft)
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'NFT não encontrado.' } },
        { status: 404 },
      );
    return HttpResponse.json({
      ...nft,
      description: `Um colecionável digital fictício da coleção Kurio, disponível na rede ${nft.network}.`,
      editions: editionsFor(nft),
    });
  }),
  http.get('/api/health', () => HttpResponse.json({ status: 'ok', source: 'msw' })),
  socket.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection);
    let connected = true;
    connection.client.addEventListener('close', () => {
      connected = false;
      sessionSockets.delete(connection.client.id);
    });
    io.client.on('session.subscribe', async (_event, value: unknown) => {
      const input = z.object({ token: z.string().min(1) }).safeParse(value);
      if (!input.success) return;
      try {
        const request = new Request(new URL('/api/auth/session', window.location.origin), {
          headers: { Authorization: `Bearer ${input.data.token}` },
        });
        const session = await sessionFrom(request);
        if (!connected) return;
        if (!session) {
          io.client.emit('session.rejected');
          return;
        }
        sessionSockets.set(connection.client.id, {
          userId: session.user.id,
          client: connection.client,
          emit: (event, payload) => io.client.emit(event, payload),
        });
        io.client.emit('session.ready', { userId: session.user.id });
      } catch {
        if (connected) io.client.emit('session.error');
      }
    });
    io.client.on('probe', () => {
      io.client.emit('nft.updated', { eventId: 'probe-nft', resourceId: 'nft-1', version: 1 });
      io.client.emit('order.updated', {
        eventId: 'probe-order',
        resourceId: 'order-1',
        version: 1,
      });
    });
  }),
];
