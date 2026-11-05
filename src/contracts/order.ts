import { z } from 'zod'

const eth = z.string().regex(/^\d+(\.\d+)?$/)
export const receiptSchema = z.object({
  transactionId: z.string(), date: z.string(), wallet: z.string(), network: z.string(),
  items: z.array(z.object({ title: z.string(), tokenId: z.string(), image: z.string(), quantity: z.number().int().positive(), subtotalEth: eth })),
  networkFeeEth: eth, totalEth: eth,
})
export type Receipt = z.infer<typeof receiptSchema>

export type OrderReceipt = Receipt
