import { z } from 'zod';
import { ethSchema } from './api';

const eth = ethSchema;
export const receiptSchema = z.object({
  transactionId: z.string(),
  date: z.string(),
  wallet: z.string(),
  network: z.string(),
  items: z.array(
    z.object({
      title: z.string(),
      tokenId: z.string(),
      image: z.string(),
      quantity: z.number().int().positive(),
      subtotalEth: eth,
    }),
  ),
  networkFeeEth: eth,
  totalEth: eth,
});
export type Receipt = z.infer<typeof receiptSchema>;

/** @deprecated Legacy alias for the preview DTO. Use ReceiptSnapshot for order receipts. */
export type OrderReceipt = Receipt;

// The preview contract above remains unchanged. Actual order receipts use immutable snapshots.
export const receiptSnapshotSchema = z.object({
  orderId: z.string().min(1),
  transactionRef: z.string().min(1),
  network: z.string().min(1),
  wallet: z.string().min(1),
  items: z
    .array(
      z.object({
        nftId: z.string().min(1),
        editionId: z.string().min(1),
        title: z.string().min(1),
        image: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPriceEth: eth,
        subtotalEth: eth,
      }),
    )
    .min(1),
  subtotalEth: eth,
  discountEth: eth,
  networkFeeEth: eth,
  totalEth: eth,
});
export type ReceiptSnapshot = z.infer<typeof receiptSnapshotSchema>;
