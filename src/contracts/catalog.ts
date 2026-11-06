import { z } from 'zod';
import { createPageSchema, ethSchema, idSchema } from './api';

export const nftSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  network: z.string().trim().min(1).max(40),
  image: z.string().min(1).max(2048),
  priceEth: ethSchema,
});
export const catalogSchema = createPageSchema(nftSchema);
export type Nft = z.infer<typeof nftSchema>;
const removeSearchQuotes = (value: unknown) =>
  typeof value === 'string' && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
const optionalEthSearchSchema = z
  .preprocess(removeSearchQuotes, z.union([ethSchema, z.literal('')]))
  .catch('')
  .default('');
export const searchSchema = z.object({
  q: z.string().trim().max(120).catch('').default(''),
  categories: z.string().catch('').default(''),
  network: z.string().trim().max(40).catch('').default(''),
  minPrice: optionalEthSearchSchema,
  maxPrice: optionalEthSearchSchema,
  sort: z.enum(['recent', 'price-asc', 'price-desc']).catch('recent').default('recent'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type CatalogSearch = z.infer<typeof searchSchema>;

export const catalogFiltersSchema = z.object({
  q: z.string().trim().max(120).default(''),
  categories: z.array(z.string().trim().min(1)).default([]),
  editions: z.array(idSchema).default([]),
  network: z.string().trim().max(40).default(''),
  minPrice: z.union([ethSchema, z.literal('')]).default(''),
  maxPrice: z.union([ethSchema, z.literal('')]).default(''),
  sort: z.enum(['recent', 'price-asc', 'price-desc']).default('recent'),
});
export const editionSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(80),
  priceEth: ethSchema,
  available: z.number().int().nonnegative(),
});
export type Edition = z.infer<typeof editionSchema>;
export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;
export function normalizeCatalogSearch(search: unknown): CatalogSearch {
  return searchSchema.parse(search);
}
export const nftDetailSchema = nftSchema.extend({
  description: z.string().trim().min(1).max(4_000),
  images: z.array(z.string().min(1).max(2048)).default([]),
  version: z.number().int().nonnegative().default(0),
  editions: z.array(editionSchema).min(1),
});
export type NftDetail = z.infer<typeof nftDetailSchema>;
