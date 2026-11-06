import { normalizeCatalogSearch, type CatalogSearch } from '@/contracts/catalog';

// Keep public keys stable while partitioning all private data by the authenticated user.
export const queryKeys = {
  session: () => ['session'] as const,
  catalog: (filters: CatalogSearch) => ['catalog', normalizeCatalogSearch(filters)] as const,
  nft: (id: string) => ['nft', id] as const,
  cart: (scope: string) =>
    scope === 'guest' ? (['cart', 'guest'] as const) : (['cart', 'user', scope] as const),
  quote: (scope: string, version: number | undefined) =>
    scope === 'guest'
      ? (['quote', 'guest', version] as const)
      : (['quote', 'user', scope, version] as const),
  profile: (userId: string) => ['user', userId, 'profile'] as const,
  favorites: (userId: string) => ['user', userId, 'favorites'] as const,
  wallets: (userId: string) => ['user', userId, 'wallets'] as const,
  order: (userId: string, orderId: string) => ['user', userId, 'order', orderId] as const,
  orders: (userId: string) => ['user', userId, 'orders'] as const,
  receiptPreview: () => ['receipt-preview'] as const,
  health: () => ['health'] as const,
};
