import { expect, test } from '@playwright/test'
import { orderSchema, walletSchema } from '../src/contracts/checkout'
import { apiErrorSchema } from '../src/contracts/api'

test('contratos propostos validam valores ETH, quantidades e estados sem alterar o recibo de prévia', () => {
  const quoteSnapshot = { id: 'quote-1', version: '1', expiresAt: '2026-11-05T12:00:00Z', network: 'ethereum', items: [{ nftId: 'nft-1', editionId: 'ten', quantity: 1, unitPriceEth: '0.000000000000000001' }], subtotalEth: '0.000000000000000001', discountEth: '0', networkFeeEth: '0.016', totalEth: '0.016000000000000001' }
  const order = { id: 'order-1', userId: 'collector-a', version: 1, status: 'pending', idempotencyKey: 'attempt-1', quoteSnapshot, transactionRef: null, createdAt: '2026-11-05T12:00:00Z' }
  expect(orderSchema.safeParse(order).success).toBe(true)
  expect(orderSchema.safeParse({ ...order, status: 'success' }).success).toBe(false)
  expect(orderSchema.safeParse({ ...order, quoteSnapshot: { ...quoteSnapshot, totalEth: 0.016 } }).success).toBe(false)
  expect(orderSchema.safeParse({ ...order, quoteSnapshot: { ...quoteSnapshot, items: [{ ...quoteSnapshot.items[0], quantity: 0.5 }] } }).success).toBe(false)
  expect(walletSchema.safeParse({ id: 'wallet-1', userId: 'collector-a', label: 'Principal', address: 'simulada', network: 'ethereum', isPrimary: true }).success).toBe(true)
  expect(walletSchema.safeParse({ id: 'wallet-1', network: 'ethereum' }).success).toBe(false)
  expect(apiErrorSchema.safeParse({ error: { code: 'ACCOUNT_EXISTS', message: 'Conflito' } }).success).toBe(true)
})
