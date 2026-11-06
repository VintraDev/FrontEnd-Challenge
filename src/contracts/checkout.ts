import { z } from 'zod';
import { ethSchema, idSchema, isoDateTimeSchema } from './api';

// Proposed contracts for the future checkout API; the existing preview DTO stays unchanged.
const id = idSchema;
const eth = ethSchema;
export const walletSchema = z.object({
  id,
  userId: id,
  label: z.string(),
  address: z.string().min(1),
  network: z.string().min(1),
  isPrimary: z.boolean(),
});
export type Wallet = z.infer<typeof walletSchema>;

export const quoteSnapshotSchema = z.object({
  id,
  version: id,
  expiresAt: isoDateTimeSchema,
  network: z.string().min(1),
  items: z.array(
    z.object({
      nftId: id,
      editionId: id,
      quantity: z.number().int().positive(),
      unitPriceEth: eth,
    }),
  ),
  subtotalEth: eth,
  discountEth: eth,
  networkFeeEth: eth,
  totalEth: eth,
});
export const orderSchema = z.object({
  id,
  userId: id,
  version: z.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'declined']),
  idempotencyKey: id,
  quoteSnapshot: quoteSnapshotSchema,
  transactionRef: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});
export const quoteRequestSchema = z.object({
  cartVersion: z.number().int().nonnegative(),
  walletId: id,
  network: z.string().trim().min(1).max(40),
  couponCode: z.string().trim().min(1).max(64).nullable().optional(),
});
export const createOrderRequestSchema = z.object({
  quoteId: id,
  walletId: id,
  network: z.string().trim().min(1).max(40),
  acceptedQuoteVersion: z.string().trim().min(1).max(160),
  acceptedQuoteHash: z.string().regex(/^[a-f0-9]{64}$/),
});
export const idempotencyKeySchema = z.string().uuid();
export type Order = z.infer<typeof orderSchema>;
export type QuoteSnapshot = z.infer<typeof quoteSnapshotSchema>;
export type QuoteRequest = z.output<typeof quoteRequestSchema>;
export type CreateOrderRequest = z.output<typeof createOrderRequestSchema>;
