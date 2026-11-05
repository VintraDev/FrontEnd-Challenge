import type { CatalogSearch } from '@/contracts/catalog'

// Keep existing keys stable. Guest cart is shared until account-cart merge is implemented.
export const queryKeys = {
  session: () => ['session'] as const,
  catalog: (filters: CatalogSearch) => ['catalog', filters] as const,
  nft: (id: string) => ['nft', id] as const,
  cart: (scope: string) => ['cart', scope] as const,
  quote: (scope: string, version: number | undefined) => ['quote', scope, version] as const,
  profile: (userId: string) => ['user', userId, 'profile'] as const,
  favorites: (userId: string) => ['user', userId, 'favorites'] as const,
  wallets: (userId: string) => ['user', userId, 'wallets'] as const,
  order: (userId: string, orderId: string) => ['user', userId, 'order', orderId] as const,
  receiptPreview: () => ['receipt-preview'] as const,
  health: () => ['health'] as const,
}
