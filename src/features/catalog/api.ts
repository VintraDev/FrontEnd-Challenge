import {
  catalogSchema,
  nftDetailSchema,
  normalizeCatalogSearch,
  type CatalogSearch,
} from '@/contracts/catalog';
import { http } from '@/lib/http';
export async function getCatalog(search: CatalogSearch, signal: AbortSignal) {
  const response = await http.get<unknown>('/nfts', {
    params: normalizeCatalogSearch(search),
    signal,
  });
  return catalogSchema.parse(response.data);
}

export async function getNft(id: string, signal: AbortSignal) {
  const response = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, { signal });
  return nftDetailSchema.parse(response.data);
}
