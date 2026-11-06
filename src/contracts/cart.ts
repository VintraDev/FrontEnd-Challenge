import { z } from 'zod';
import { ethSchema, idSchema, isoDateTimeSchema } from './api';

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
export const quoteNetworkSchema = z.enum(['Ethereum', 'Polygon']);
export const quoteItemSnapshotSchema = cartLineInputSchema.extend({
  unitPriceEth: ethSchema,
  available: z.number().int().nonnegative(),
});
export const quoteSchema = z.object({
  id: idSchema,
  version: idSchema,
  quoteHash: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: isoDateTimeSchema,
  cartVersion: z.number().int().nonnegative(),
  walletId: idSchema.nullable(),
  network: quoteNetworkSchema.nullable(),
  coupon: z.string().nullable(),
  items: z.array(quoteItemSnapshotSchema),
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
});
export const quoteRequestSchema = z
  .object({
    cartVersion: z.number().int().nonnegative(),
    walletId: idSchema.optional(),
    network: quoteNetworkSchema.optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.walletId) !== Boolean(value.network))
      context.addIssue({
        code: 'custom',
        message: 'Carteira e rede devem ser informadas juntas para a cotação de confirmação.',
      });
  });
/** @deprecated Calls without walletId/network remain supported for cart previews. */
export const guestQuoteRequestSchema = quoteRequestSchema;
export type Cart = z.infer<typeof cartSchema>;

export type CartItem = z.infer<typeof cartItemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type QuoteRequest = z.input<typeof quoteRequestSchema>;
