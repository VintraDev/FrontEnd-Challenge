import { http, HttpResponse } from 'msw';
import { createOrderRequestSchema, idempotencyKeySchema } from '@/contracts/checkout';
import { orderDetailSchema, orderListSchema } from '@/contracts/order-detail';
import { sessionFrom } from './auth-handlers';
import {
  createAttempt,
  findAttempt,
  readOrders,
  settleOrderInStore,
  type StoredOrder,
} from './db/orders';
import { readQuote } from './db/quotes';
import { changeCart, readCart } from './db/cart';
import { readWallets } from './db/wallets';
import { editionsFor } from './fixtures/editions';
import { catalogSnapshot, readScenario } from './scenarios/catalog';
import Decimal from 'decimal.js';

const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });
const unauthorized = () => fail(401, 'SESSION_EXPIRED', 'Entre para consultar seus pedidos.');
const missing = () => fail(404, 'NOT_FOUND', 'Pedido não encontrado.');
const hash = async (value: string) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))),
    (n) => n.toString(16).padStart(2, '0'),
  ).join('');
async function settle(order: StoredOrder) {
  const outcome = await settleOrderInStore(order.id, order.userId);
  if (!outcome) return order;
  if (outcome.justConfirmed) {
    await changeCart((cart) => {
      if (cart.debitedOrderIds?.includes(order.id)) return cart;
      const nextLines = cart.lines.flatMap((line) => {
        const bought =
          outcome.order.quoteSnapshot.items.find(
            (item) => item.nftId === line.nftId && item.editionId === line.editionId,
          )?.quantity ?? 0;
        const quantity = line.quantity - bought;
        return quantity > 0 ? [{ ...line, quantity }] : [];
      });
      return {
        ...cart,
        version: cart.version + 1,
        coupon: nextLines.length > 0 ? cart.coupon : null,
        lines: nextLines,
        debitedOrderIds: [...(cart.debitedOrderIds ?? []), order.id],
      };
    }, `user:${order.userId}`);
  }
  return outcome.order;
}
async function ownedOrder(userId: string, id: string) {
  const order = (await readOrders(userId)).find((item) => item.id === id);
  return order ? settle(order) : undefined;
}
export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const session = await sessionFrom(request);
    if (!session) return unauthorized();
    const key = idempotencyKeySchema.safeParse(request.headers.get('idempotency-key'));
    const input = createOrderRequestSchema.safeParse(await request.json());
    if (!key.success || !input.success)
      return fail(422, 'VALIDATION_ERROR', 'Pedido ou chave de idempotência inválidos.');
    const attemptHash = await hash(
      JSON.stringify({
        quoteId: input.data.quoteId,
        walletId: input.data.walletId,
        network: input.data.network,
        acceptedQuoteVersion: input.data.acceptedQuoteVersion,
        acceptedQuoteHash: input.data.acceptedQuoteHash,
      }),
    );
    const existing = await findAttempt(session.user.id, key.data);
    if (existing) {
      if (existing.attemptHash !== attemptHash)
        return fail(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro pedido.');
      return HttpResponse.json(orderDetailSchema.parse(await settle(existing)), { status: 200 });
    }
    const quote = await readQuote(input.data.quoteId);
    const wallet = (await readWallets(session.user.id)).find(
      (item) => item.id === input.data.walletId,
    );
    const cart = await readCart(`user:${session.user.id}`);
    const catalog = catalogSnapshot();
    const quoteStillMatchesCatalog =
      !!quote &&
      quote.items.every((item) => {
        const nft = catalog.find((candidate) => candidate.id === item.nftId);
        const edition =
          nft && editionsFor(nft).find((candidate) => candidate.id === item.editionId);
        return (
          !!edition &&
          new Decimal(edition.priceEth).eq(item.unitPriceEth) &&
          edition.available >= item.quantity
        );
      });
    if (
      !quote ||
      quote.ownerId !== session.user.id ||
      quote.walletId !== input.data.walletId ||
      quote.network !== input.data.network ||
      quote.version !== input.data.acceptedQuoteVersion ||
      quote.quoteHash !== input.data.acceptedQuoteHash ||
      quote.cartVersion !== cart.version ||
      !quoteStillMatchesCatalog ||
      !wallet ||
      wallet.connectionStatus !== 'connected' ||
      wallet.network !== input.data.network ||
      Date.parse(quote.expiresAt) <= Date.now()
    )
      return fail(409, 'QUOTE_STALE', 'A cotação não é mais válida. Revise antes de confirmar.');
    const scenario = readScenario().orders ?? 'default';
    const order: StoredOrder = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      version: 1,
      status: 'pending',
      idempotencyKey: key.data,
      createdAt: new Date().toISOString(),
      transactionRef: null,
      receipt: null,
      walletSnapshot: `${wallet.walletType} · ${wallet.label} (${wallet.ens || wallet.address})`,
      settleAt: Date.now() + 350,
      settleStatus: scenario === 'decline' ? 'declined' : 'confirmed',
      quoteSnapshot: {
        id: quote.id,
        version: quote.version,
        expiresAt: quote.expiresAt,
        network: quote.network,
        items: quote.items.map(({ nftId, editionId, quantity, unitPriceEth }) => ({
          nftId,
          editionId,
          quantity,
          unitPriceEth,
        })),
        subtotalEth: quote.subtotalEth,
        discountEth: quote.discountEth,
        networkFeeEth: quote.networkFeeEth,
        totalEth: quote.totalEth,
      },
      receiptItems: quote.receiptItems.map((item) => ({
        ...item,
        subtotalEth: new Decimal(item.unitPriceEth).mul(item.quantity).toString(),
      })),
    };
    const result = await createAttempt(order, attemptHash);
    if (result.conflict)
      return fail(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro pedido.');
    if (scenario === 'timeout-after-commit' && result.created) return HttpResponse.error();
    return HttpResponse.json(orderDetailSchema.parse(await settle(result.order)), {
      status: result.created ? 201 : 200,
    });
  }),
  http.get('/api/orders', async ({ request }) => {
    const s = await sessionFrom(request);
    if (!s) return unauthorized();
    try {
      return HttpResponse.json(
        orderListSchema.parse({
          items: await Promise.all((await readOrders(s.user.id)).map(settle)),
        }),
      );
    } catch {
      return fail(500, 'STORE_ERROR', 'Não foi possível consultar os pedidos.');
    }
  }),
  http.get('/api/orders/by-key/:key', async ({ request, params }) => {
    const s = await sessionFrom(request);
    if (!s) return unauthorized();
    const o = (await readOrders(s.user.id)).find((x) => x.idempotencyKey === params.key);
    return o ? HttpResponse.json(orderDetailSchema.parse(await settle(o))) : missing();
  }),
  http.get('/api/orders/:orderId', async ({ request, params }) => {
    const s = await sessionFrom(request);
    if (!s) return unauthorized();
    const o = await ownedOrder(s.user.id, String(params.orderId));
    return o ? HttpResponse.json(orderDetailSchema.parse(o)) : missing();
  }),
];
