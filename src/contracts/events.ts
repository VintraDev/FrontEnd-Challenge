import { z } from 'zod';
import { ethSchema, idSchema, isoDateTimeSchema } from './api';
import { orderSchema } from './checkout';

const eventBaseSchema = z.object({
  eventId: idSchema,
  resourceId: idSchema,
  version: z.number().int().nonnegative(),
  changedAt: isoDateTimeSchema,
});

export const nftUpdatedEventSchema = eventBaseSchema.extend({
  type: z.literal('nft.updated'),
  editionId: idSchema.optional(),
  changes: z
    .object({
      priceEth: ethSchema.optional(),
      available: z.number().int().nonnegative().optional(),
    })
    .refine((changes) => Object.keys(changes).length > 0, 'Informe ao menos uma mudança de NFT.'),
});
export const orderUpdatedEventSchema = eventBaseSchema.extend({
  type: z.literal('order.updated'),
  ownerScope: idSchema,
  changes: z.object({ status: orderSchema.shape.status }),
});
export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
]);

export type NftUpdatedEvent = z.output<typeof nftUpdatedEventSchema>;
export type OrderUpdatedEvent = z.output<typeof orderUpdatedEventSchema>;
export type RealtimeEvent = z.output<typeof realtimeEventSchema>;
