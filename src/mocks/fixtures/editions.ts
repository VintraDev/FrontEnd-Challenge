import type { Nft } from '@/contracts/catalog';
import { stockForScenario } from '../scenarios/catalog';
export function editionsFor(nft: Nft) {
  return [
    { id: 'unique', label: '1/1', priceEth: nft.priceEth, available: 0 },
    { id: 'ten', label: '1/10', priceEth: nft.priceEth, available: stockForScenario(nft.id, 2) },
    { id: 'fifty', label: '1/50', priceEth: nft.priceEth, available: stockForScenario(nft.id, 8) },
    {
      id: 'open',
      label: 'ABERTA',
      priceEth: nft.priceEth,
      available: stockForScenario(nft.id, 20),
    },
  ];
}
