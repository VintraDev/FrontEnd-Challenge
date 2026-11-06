import { z } from 'zod'

// Proposed contracts for the future checkout API; the existing preview DTO stays unchanged.
const id = z.string().min(1)
const eth = z.string().regex(/^\d+(\.\d+)?$/)
export const walletSchema = z.object({
  id, userId: id, label: z.string(), address: z.string().min(1), network: z.string().min(1), isPrimary: z.boolean(),
})
export type Wallet = z.infer<typeof walletSchema>

export const quoteSnapshotSchema = z.object({
  id, version: id, expiresAt: z.iso.datetime(), network: z.string().min(1),
  items: z.array(z.object({ nftId: id, editionId: id, quantity: z.number().int().positive(), unitPriceEth: eth })),
  subtotalEth: eth, discountEth: eth, networkFeeEth: eth, totalEth: eth,
})
export const orderSchema = z.object({
  id, userId: id, version: z.number().int().positive(), status: z.enum(['pending', 'confirmed', 'declined']),
  idempotencyKey: id, quoteSnapshot: quoteSnapshotSchema, transactionRef: z.string().nullable(), createdAt: z.iso.datetime(),
})
export type Order = z.infer<typeof orderSchema>
export type QuoteSnapshot = z.infer<typeof quoteSnapshotSchema>
