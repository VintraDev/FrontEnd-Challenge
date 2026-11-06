import { describe, expect, it } from 'vitest';
import { apiErrorSchema, ethSchema } from '@/contracts/api';
import { catalogSchema } from '@/contracts/catalog';
import {
  createOrderRequestSchema,
  idempotencyKeySchema,
  orderSchema,
  walletSchema,
} from '@/contracts/checkout';
import { realtimeControlSchema, realtimeEventSchema } from '@/contracts/events';
import { orderDetailSchema } from '@/contracts/order-detail';
import {
  isForbiddenWalletSecret,
  walletConnectionRequestSchema,
  walletInputSchema,
  walletRecordSchema,
} from '@/contracts/wallets';

describe('contracts', () => {
  it('valida ETH decimal, catálogo, erros e eventos em tempo real', () => {
    expect(ethSchema.parse('1.2300')).toBe('1.23');
    expect(ethSchema.safeParse(1.23).success).toBe(false);
    expect(catalogSchema.parse({ items: [], page: 1, total: 0, totalPages: 0 }).pageSize).toBe(9);
    expect(
      apiErrorSchema.safeParse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Inválido',
          fieldErrors: { email: ['Informe um e-mail válido.'] },
        },
      }).success,
    ).toBe(true);
    expect(
      realtimeEventSchema.safeParse({
        eventId: 'evt-1',
        type: 'nft.updated',
        resourceId: 'nft-1',
        version: 2,
        changedAt: '2026-11-05T12:00:00.000Z',
        editionId: 'ten',
        changes: { priceEth: '0.125' },
      }).success,
    ).toBe(true);
    expect(
      realtimeControlSchema.safeParse({
        eventId: 'evt-2',
        type: 'order.updated',
        resourceId: 'order-1',
        ownerScope: 'collector-a',
        version: 2,
        changedAt: '2026-11-05T12:00:00.000Z',
        changes: { status: 'declined' },
      }).success,
    ).toBe(true);
  });

  it('valida carteiras, bloqueio de segredos reais e transições de conexão', () => {
    expect(
      walletSchema.safeParse({
        id: 'wallet-1',
        userId: 'collector-a',
        label: 'Principal',
        address: 'simulada',
        network: 'ethereum',
        isPrimary: true,
      }).success,
    ).toBe(true);
    expect(
      isForbiddenWalletSecret('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    ).toBe(true);
    expect(
      isForbiddenWalletSecret(
        'abandon ability able about above absent absorb abstract absurd abuse access accident',
      ),
    ).toBe(true);
    expect(isForbiddenWalletSecret('0x1111111111111111111111111111111111111111')).toBe(false);
    expect(
      walletInputSchema.safeParse({
        displayName: 'Ana',
        label: 'Principal',
        network: 'Ethereum',
        profileName: 'ana',
        address: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        secondaryAddress: '',
        walletType: 'MetaMask',
        referralCode: 'KURIO',
        email: 'ana@kurio.test',
        ens: 'ana.eth',
        isPrimary: true,
      }).success,
    ).toBe(false);
    expect(
      walletRecordSchema.parse({
        id: 'w-1',
        userId: 'collector-a',
        displayName: 'Ana',
        label: 'Principal',
        network: 'Polygon',
        profileName: 'ana',
        address: '0x1111111111111111111111111111111111111111',
        secondaryAddress: '',
        walletType: 'Coinbase Wallet',
        referralCode: 'KURIO',
        email: 'ana@kurio.test',
        ens: 'ana.eth',
        isPrimary: true,
      }).connectionStatus,
    ).toBe('disconnected');
    expect(
      walletConnectionRequestSchema.safeParse({
        action: 'connect',
        network: 'Polygon',
        walletType: 'WalletConnect',
      }).success,
    ).toBe(true);
  });

  it('valida pedidos, idempotência e correspondência do recibo snapshot', () => {
    const quoteSnapshot = {
      id: 'quote-1',
      version: '1',
      expiresAt: '2026-11-05T12:00:00Z',
      network: 'Ethereum',
      items: [{ nftId: 'nft-1', editionId: 'ten', quantity: 1, unitPriceEth: '1.19' }],
      subtotalEth: '1.19',
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '1.206',
    };
    const pendingOrder = {
      id: 'order-1',
      userId: 'collector-a',
      version: 1,
      status: 'pending' as const,
      idempotencyKey: 'attempt-1',
      quoteSnapshot,
      transactionRef: null,
      createdAt: '2026-11-05T12:00:00Z',
    };
    expect(orderSchema.safeParse(pendingOrder).success).toBe(true);
    expect(orderDetailSchema.safeParse({ ...pendingOrder, receipt: null }).success).toBe(true);
    expect(
      orderDetailSchema.safeParse({
        ...pendingOrder,
        status: 'confirmed',
        transactionRef: 'tx-1',
        receipt: {
          orderId: 'order-1',
          transactionRef: 'tx-1',
          network: 'Ethereum',
          wallet: 'MetaMask',
          items: [
            {
              nftId: 'nft-1',
              editionId: 'ten',
              title: 'Emerald Ape 042',
              image: '/assets/nfts/image-import-1.png',
              quantity: 1,
              unitPriceEth: '1.19',
              subtotalEth: '1.19',
            },
          ],
          subtotalEth: '1.19',
          discountEth: '0',
          networkFeeEth: '0.016',
          totalEth: '1.206',
        },
      }).success,
    ).toBe(true);
    expect(idempotencyKeySchema.safeParse('11111111-1111-4111-8111-111111111111').success).toBe(
      true,
    );
    expect(
      createOrderRequestSchema.safeParse({
        quoteId: 'quote-1',
        walletId: 'wallet-1',
        network: 'Ethereum',
        acceptedQuoteVersion: 'cart-1-abcdef012345',
        acceptedQuoteHash: 'a'.repeat(64),
      }).success,
    ).toBe(true);
  });
});
