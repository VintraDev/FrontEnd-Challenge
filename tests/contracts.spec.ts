import { expect, test } from '@playwright/test';
import { orderSchema, walletSchema } from '../src/contracts/checkout';
import { apiErrorSchema, ethSchema } from '../src/contracts/api';
import { catalogSchema } from '../src/contracts/catalog';
import { realtimeEventSchema } from '../src/contracts/events';
import {
  isForbiddenWalletSecret,
  walletConnectionRequestSchema,
  walletInputSchema,
  walletRecordSchema,
} from '../src/contracts/wallets';
import { queryKeys } from '../src/lib/query-keys';

test('contratos propostos validam valores ETH, quantidades e estados sem alterar o recibo de prévia', () => {
  const quoteSnapshot = {
    id: 'quote-1',
    version: '1',
    expiresAt: '2026-11-05T12:00:00Z',
    network: 'ethereum',
    items: [
      { nftId: 'nft-1', editionId: 'ten', quantity: 1, unitPriceEth: '0.000000000000000001' },
    ],
    subtotalEth: '0.000000000000000001',
    discountEth: '0',
    networkFeeEth: '0.016',
    totalEth: '0.016000000000000001',
  };
  const order = {
    id: 'order-1',
    userId: 'collector-a',
    version: 1,
    status: 'pending',
    idempotencyKey: 'attempt-1',
    quoteSnapshot,
    transactionRef: null,
    createdAt: '2026-11-05T12:00:00Z',
  };
  expect(orderSchema.safeParse(order).success).toBe(true);
  expect(orderSchema.safeParse({ ...order, status: 'success' }).success).toBe(false);
  expect(
    orderSchema.safeParse({ ...order, quoteSnapshot: { ...quoteSnapshot, totalEth: 0.016 } })
      .success,
  ).toBe(false);
  expect(
    orderSchema.safeParse({
      ...order,
      quoteSnapshot: { ...quoteSnapshot, items: [{ ...quoteSnapshot.items[0], quantity: 0.5 }] },
    }).success,
  ).toBe(false);
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
  expect(walletSchema.safeParse({ id: 'wallet-1', network: 'ethereum' }).success).toBe(false);
  expect(
    apiErrorSchema.safeParse({ error: { code: 'ACCOUNT_EXISTS', message: 'Conflito' } }).success,
  ).toBe(true);
  expect(
    apiErrorSchema.safeParse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Inválido',
        fieldErrors: { email: ['Informe um e-mail válido.'] },
      },
    }).success,
  ).toBe(true);
  expect(ethSchema.parse('1.2300')).toBe('1.23');
  expect(ethSchema.safeParse(1.23).success).toBe(false);
  expect(catalogSchema.parse({ items: [], page: 1, total: 0, totalPages: 0 }).pageSize).toBe(9);
  expect(
    queryKeys.catalog({
      q: '',
      categories: '',
      network: '',
      minPrice: '1.2300',
      maxPrice: '',
      sort: 'recent',
      page: 1,
    })[1],
  ).toMatchObject({ minPrice: '1.23' });
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
