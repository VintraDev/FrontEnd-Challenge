import { http, HttpResponse } from 'msw';
import Decimal from 'decimal.js';
import {
  cartLineInputSchema,
  cartQuantityInputSchema,
  couponInputSchema,
  guestQuoteRequestSchema,
} from '@/contracts/cart';
import { catalogSnapshot } from './scenarios/catalog';
import { editionsFor } from './fixtures/editions';
import { changeCart, mergeGuestCart, readCart, type CartRecord } from './db/cart';
import { sessionFrom } from './auth-handlers';
import { readWallets } from './db/wallets';
import { readScenario } from './scenarios/catalog';
import { saveQuote } from './db/quotes';

class CartError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = status === 401 ? 'SESSION_EXPIRED' : 'CART_ERROR',
  ) {
    super(message);
  }
}
const fail = (error: unknown) =>
  error instanceof CartError
    ? HttpResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      )
    : HttpResponse.json(
        { error: { code: 'STORE_ERROR', message: 'Não foi possível acessar o carrinho.' } },
        { status: 500 },
      );
async function cartScope(request: Request) {
  if (!request.headers.has('authorization')) return 'guest';
  const session = await sessionFrom(request);
  if (!session) throw new CartError(401, 'Sua sessão expirou. Entre novamente.');
  return `user:${session.user.id}`;
}
function editionFor(nftId: string, editionId: string) {
  const nft = catalogSnapshot().find((item) => item.id === nftId);
  const edition = nft && editionsFor(nft).find((item) => item.id === editionId);
  if (!nft || !edition) throw new CartError(404, 'NFT ou edição não encontrado.');
  return { nft, edition };
}
function materialize(cart: CartRecord) {
  return {
    ...cart,
    lines: cart.lines.map((line) => {
      const { nft, edition } = editionFor(line.nftId, line.editionId);
      return {
        ...line,
        title: nft.title,
        image: nft.image,
        editionLabel: edition.label,
        available: edition.available,
        priceEth: edition.priceEth,
        lineTotalEth: new Decimal(edition.priceEth).mul(line.quantity).toString(),
      };
    }),
  };
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (part) => part.toString(16).padStart(2, '0')).join('');
}
export const cartHandlers = [
  http.post('/api/cart/merge', async ({ request }) => {
    try {
      const session = await sessionFrom(request);
      if (!session) throw new CartError(401, 'Sua sessão expirou. Entre novamente.');
      await mergeGuestCart(session.user.id, (account, guest) => {
        const lines = account.lines.map((line) => ({ ...line }));
        for (const line of guest.lines) {
          const existing = lines.find(
            (item) => item.nftId === line.nftId && item.editionId === line.editionId,
          );
          const quantity = (existing?.quantity ?? 0) + line.quantity;
          if (quantity > editionFor(line.nftId, line.editionId).edition.available)
            throw new CartError(
              409,
              'Não foi possível mesclar o carrinho por falta de estoque. O carrinho visitante foi preservado.',
            );
          if (existing) existing.quantity = quantity;
          else lines.push({ ...line });
        }
        return { version: account.version + 1, lines, coupon: account.coupon ?? guest.coupon };
      });
      return new HttpResponse(null, { status: 204 });
    } catch (error) {
      return fail(error);
    }
  }),
  http.get('/api/cart', async ({ request }) => {
    try {
      return HttpResponse.json(materialize(await readCart(await cartScope(request))));
    } catch (error) {
      return fail(error);
    }
  }),
  http.post('/api/cart/items', async ({ request }) => {
    try {
      const scope = await cartScope(request);
      const input = cartLineInputSchema.safeParse(await request.json());
      if (!input.success) throw new CartError(422, 'Informe uma quantidade inteira válida.');
      const { nftId, editionId, quantity } = input.data;
      const { edition } = editionFor(nftId, editionId);
      const cart = await changeCart((current) => {
        const existing = current.lines.find(
          (line) => line.nftId === nftId && line.editionId === editionId,
        );
        const nextQuantity = (existing?.quantity ?? 0) + quantity;
        if (nextQuantity > edition.available)
          throw new CartError(409, 'Quantidade indisponível para esta edição.');
        const lines = existing
          ? current.lines.map((line) =>
              line.id === existing.id ? { ...line, quantity: nextQuantity } : line,
            )
          : [...current.lines, { id: crypto.randomUUID(), nftId, editionId, quantity }];
        return { ...current, version: current.version + 1, lines };
      }, scope);
      return HttpResponse.json(materialize(cart), { status: 201 });
    } catch (error) {
      return fail(error);
    }
  }),
  http.patch('/api/cart/items/:id', async ({ request, params }) => {
    try {
      const scope = await cartScope(request);
      const input = cartQuantityInputSchema.safeParse(await request.json());
      if (!input.success) throw new CartError(422, 'Informe uma quantidade inteira válida.');
      const cart = await changeCart((current) => {
        const line = current.lines.find((item) => item.id === params.id);
        if (!line) throw new CartError(404, 'Item não encontrado.');
        if (input.data.quantity > editionFor(line.nftId, line.editionId).edition.available)
          throw new CartError(409, 'Quantidade indisponível para esta edição.');
        return {
          ...current,
          version: current.version + 1,
          lines: current.lines.map((item) =>
            item.id === line.id ? { ...item, quantity: input.data.quantity } : item,
          ),
        };
      }, scope);
      return HttpResponse.json(materialize(cart));
    } catch (error) {
      return fail(error);
    }
  }),
  http.delete('/api/cart/items/:id', async ({ request, params }) => {
    try {
      const scope = await cartScope(request);
      const cart = await changeCart((current) => {
        if (!current.lines.some((line) => line.id === params.id))
          throw new CartError(404, 'Item não encontrado.');
        return {
          ...current,
          version: current.version + 1,
          lines: current.lines.filter((line) => line.id !== params.id),
        };
      }, scope);
      return HttpResponse.json(materialize(cart));
    } catch (error) {
      return fail(error);
    }
  }),
  http.post('/api/cart/coupon', async ({ request }) => {
    try {
      const scope = await cartScope(request);
      const input = couponInputSchema.safeParse(await request.json());
      if (!input.success) throw new CartError(422, 'Informe o código promocional.');
      const code = input.data.code.toUpperCase();
      if (code === 'EXPIRADO') throw new CartError(422, 'Cupom expirado.');
      if (code !== 'KURIO10') throw new CartError(422, 'Cupom inválido.');
      return HttpResponse.json(
        materialize(
          await changeCart((cart) => ({ ...cart, coupon: code, version: cart.version + 1 }), scope),
        ),
      );
    } catch (error) {
      return fail(error);
    }
  }),
  http.delete('/api/cart/coupon', async ({ request }) => {
    try {
      const scope = await cartScope(request);
      return HttpResponse.json(
        materialize(
          await changeCart((cart) => ({ ...cart, coupon: null, version: cart.version + 1 }), scope),
        ),
      );
    } catch (error) {
      return fail(error);
    }
  }),
  http.post('/api/quotes', async ({ request }) => {
    try {
      const input = guestQuoteRequestSchema.safeParse(await request.json());
      if (!input.success) throw new CartError(422, 'Versão de carrinho inválida.');
      const scope = await cartScope(request);
      const cart = materialize(await readCart(scope));
      if (cart.version !== input.data.cartVersion)
        throw new CartError(409, 'O carrinho mudou. Atualize a cotação.', 'QUOTE_STALE');
      if (cart.lines.some((line) => line.quantity > line.available))
        throw new CartError(
          409,
          'O estoque mudou. Atualize a cotação antes de continuar.',
          'QUOTE_STALE',
        );
      let walletId: string | null = null;
      let network: 'Ethereum' | 'Polygon' | null = null;
      if (input.data.walletId && input.data.network) {
        const session = await sessionFrom(request);
        if (!session)
          throw new CartError(401, 'Sua sessão expirou. Entre novamente.', 'SESSION_EXPIRED');
        const wallet = (await readWallets(session.user.id)).find(
          (item) => item.id === input.data.walletId,
        );
        if (!wallet) throw new CartError(404, 'Carteira não encontrada.', 'NOT_FOUND');
        if (wallet.connectionStatus !== 'connected')
          throw new CartError(
            409,
            'Conecte a carteira selecionada antes de gerar a cotação.',
            'WALLET_NOT_CONNECTED',
          );
        if (wallet.network !== input.data.network)
          throw new CartError(409, 'A rede da carteira mudou. Atualize a cotação.', 'QUOTE_STALE');
        walletId = wallet.id;
        network = wallet.network;
      }
      const subtotal = cart.lines.reduce(
        (sum, line) => sum.plus(line.lineTotalEth),
        new Decimal(0),
      );
      const discount = cart.coupon === 'KURIO10' ? subtotal.mul('0.1') : new Decimal(0);
      const fee = cart.lines.length
        ? network === 'Polygon'
          ? new Decimal('0.004')
          : new Decimal('0.016')
        : new Decimal(0);
      const items = cart.lines.map((line) => ({
        nftId: line.nftId,
        editionId: line.editionId,
        quantity: line.quantity,
        unitPriceEth: line.priceEth,
        available: line.available,
      }));
      const canonical = JSON.stringify({
        cartVersion: cart.version,
        coupon: cart.coupon,
        walletId,
        network,
        items: [...items].sort((left, right) =>
          `${left.nftId}:${left.editionId}`.localeCompare(`${right.nftId}:${right.editionId}`),
        ),
        subtotalEth: subtotal.toString(),
        discountEth: discount.toString(),
        networkFeeEth: fee.toString(),
        totalEth: subtotal.minus(discount).plus(fee).toString(),
      });
      const quoteHash = await sha256(canonical);
      const expired = readScenario().quote === 'expired';
      const quote = {
        id: crypto.randomUUID(),
        version: `cart-${cart.version}-${quoteHash.slice(0, 12)}`,
        quoteHash,
        expiresAt: new Date(Date.now() + (expired ? -1 : 2 * 60 * 1000)).toISOString(),
        cartVersion: cart.version,
        walletId,
        network,
        coupon: cart.coupon,
        items,
        subtotalEth: subtotal.toString(),
        discountEth: discount.toString(),
        networkFeeEth: fee.toString(),
        totalEth: subtotal.minus(discount).plus(fee).toString(),
      };
      if (walletId && network) {
        const session = await sessionFrom(request);
        if (session)
          await saveQuote({
            ...quote,
            ownerId: session.user.id,
            receiptItems: cart.lines.map((line) => ({
              nftId: line.nftId,
              editionId: line.editionId,
              title: line.title,
              image: line.image,
              quantity: line.quantity,
              unitPriceEth: line.priceEth,
            })),
          });
      }
      return HttpResponse.json(quote);
    } catch (error) {
      return fail(error);
    }
  }),
];
