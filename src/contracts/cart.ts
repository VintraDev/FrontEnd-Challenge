import { z } from 'zod'
const eth = z.string().regex(/^\d+(\.\d+)?$/)
export const cartItemSchema = z.object({ id: z.string(), nftId: z.string(), editionId: z.string(), editionLabel: z.string(), title: z.string(), image: z.string(), quantity: z.number().int().positive(), available: z.number().int().nonnegative(), priceEth: eth, lineTotalEth: eth })
export const cartSchema = z.object({ version: z.number().int(), coupon: z.string().nullable(), lines: z.array(cartItemSchema) })
export const quoteSchema = z.object({ cartVersion: z.number().int(), subtotalEth: eth, discountEth: eth, networkFeeEth: eth, totalEth: eth })
export type Cart = z.infer<typeof cartSchema>

export type CartItem = z.infer<typeof cartItemSchema>
export type Quote = z.infer<typeof quoteSchema>
