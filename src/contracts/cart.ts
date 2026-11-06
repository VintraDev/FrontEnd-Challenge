import { z } from 'zod';
import { ethSchema, idSchema } from './api';

export const cartLineInputSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  quantity: z.number().int().positive(),
});
export const cartQuantityInputSchema = z.object({ quantity: z.number().int().positive() });
export const couponInputSchema = z.object({ code: z.string().trim().min(1).max(64) });
export const cartItemSchema = cartLineInputSchema.extend({
  id: idSchema,
  editionLabel: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  image: z.string().min(1).max(2048),
  available: z.number().int().nonnegative(),
  priceEth: ethSchema,
  lineTotalEth: ethSchema,
});
export const cartSchema = z.object({
  version: z.number().int(),
  coupon: z.string().nullable(),
  lines: z.array(cartItemSchema),
});
export const quoteSchema = z.object({
  cartVersion: z.number().int().nonnegative(),
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
});
export const guestQuoteRequestSchema = z.object({ cartVersion: z.number().int().nonnegative() });
export type Cart = z.infer<typeof cartSchema>;

export type CartItem = z.infer<typeof cartItemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
