import type { Nft } from '@/contracts/catalog'
export function editionsFor(nft: Nft) {
  return [
    { id: 'unique', label: '1/1', priceEth: nft.priceEth, available: 0 },
    { id: 'ten', label: '1/10', priceEth: nft.priceEth, available: 2 },
    { id: 'fifty', label: '1/50', priceEth: nft.priceEth, available: 8 },
    { id: 'open', label: 'ABERTA', priceEth: nft.priceEth, available: 20 },
  ]
}
