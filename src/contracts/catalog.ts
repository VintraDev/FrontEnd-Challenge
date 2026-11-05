import { z } from 'zod'
export const nftSchema = z.object({ id: z.string(), title: z.string(), category: z.string(), network: z.string(), image: z.string(), priceEth: z.string().regex(/^\d+(\.\d+)?$/) })
export const catalogSchema = z.object({ items: z.array(nftSchema), total: z.number().int(), page: z.number().int(), totalPages: z.number().int() })
export type Nft = z.infer<typeof nftSchema>
export const searchSchema = z.object({ q: z.string().catch('').default(''), categories: z.string().catch('').default(''), network: z.string().catch('').default(''), minPrice: z.string().regex(/^\d+(\.\d+)?$/).or(z.literal('')).catch('').default(''), maxPrice: z.string().regex(/^\d+(\.\d+)?$/).or(z.literal('')).catch('').default(''), sort: z.enum(['recent', 'price-asc', 'price-desc']).catch('recent').default('recent'), page: z.coerce.number().int().min(1).catch(1).default(1) })
export type CatalogSearch = z.infer<typeof searchSchema>

export const nftDetailSchema = nftSchema.extend({ description: z.string(), editions: z.array(z.object({ id: z.string(), label: z.string(), priceEth: z.string().regex(/^\d+(\.\d+)?$/), available: z.number().int().nonnegative() })).min(1) })
export type NftDetail = z.infer<typeof nftDetailSchema>
