import { http, HttpResponse, ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import Decimal from 'decimal.js';
import { editionsFor } from './fixtures/editions';
import { cartHandlers } from './cart-handlers';
import { authHandlers, resetAuth } from './auth-handlers';
import { resetCarts } from './db/cart';
import { resetFavorites } from './db/favorites';
import { favoriteHandlers } from './favorite-handlers';
import { walletHandlers } from './wallet-handlers';
import { resetWallets } from './db/wallets';
import { receiptPreview } from './fixtures/receipt-preview';
import { scenarioSchema } from '@/contracts/scenarios';
import {
  catalogScenarioResponse,
  catalogSnapshot,
  resetScenario,
  setScenario,
} from './scenarios/catalog';

const socket = ws.link('/');
export const handlers = [
  http.post('/api/__test/reset', async () => {
    try {
      await resetAuth();
      await resetCarts();
      await resetFavorites();
      await resetWallets();
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
      return HttpResponse.json(parsed.data);
    } catch {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cenário inválido.' } },
        { status: 422 },
      );
    }
  }),
  ...authHandlers,
  ...favoriteHandlers,
  ...walletHandlers,
  ...cartHandlers,
  http.get('/api/orders/preview', () => HttpResponse.json(receiptPreview)),
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
