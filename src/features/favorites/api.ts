import { favoritesSchema } from '@/contracts/favorites';
import { http } from '@/lib/http';

export async function getFavorites(signal?: AbortSignal) {
  return favoritesSchema.parse((await http.get<unknown>('/favorites', { signal })).data);
}
export async function changeFavorite(nftId: string, add: boolean) {
  const response = add
    ? await http.post<unknown>('/favorites', { nftId })
    : await http.delete<unknown>(`/favorites/${encodeURIComponent(nftId)}`);
  return favoritesSchema.parse(response.data);
}
