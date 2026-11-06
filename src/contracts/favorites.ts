import { z } from 'zod'
import { nftSchema } from './catalog'

export const favoritesSchema = z.object({ items: z.array(nftSchema) })
export const favoriteInputSchema = z.object({ nftId: z.string().min(1) }).strict()
export type Favorites = z.infer<typeof favoritesSchema>
