import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './api';
import { nftSchema } from './catalog';

export const favoriteSchema = z.object({
  nftId: idSchema,
  createdAt: isoDateTimeSchema,
});
/** The current favorites endpoint returns the summarized NFTs, not metadata-only records. */
export const favoritesSchema = z.object({ items: z.array(nftSchema) });
export const favoriteInputSchema = z.object({ nftId: idSchema });
export const addFavoriteRequestSchema = favoriteInputSchema;

export type Favorite = z.output<typeof favoriteSchema>;
export type Favorites = z.output<typeof favoritesSchema>;
export type AddFavoriteRequest = z.output<typeof addFavoriteRequestSchema>;
