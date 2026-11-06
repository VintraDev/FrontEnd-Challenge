import type { Receipt } from '@/contracts/order';

// Amostra isolada para revisão visual: não representa um pedido criado.
export const receiptPreview: Receipt = {
  transactionId: '0xA91F…E82C',
  date: '29 Jul, 2026',
  wallet: 'MetaMask',
  network: 'Ethereum',
  items: [
    {
      title: 'Emerald Ape #042',
      tokenId: '#0042',
      image: '/assets/nfts/image-import-1.png',
      quantity: 2,
      subtotalEth: '2.38',
    },
    {
      title: 'Violet Nomad #314',
      tokenId: '#0314',
      image: '/assets/nfts/image-import.png',
      quantity: 6,
      subtotalEth: '8.34',
    },
    {
      title: 'Ivory Baron #088',
      tokenId: '#0088',
      image: '/assets/nfts/image-import-3.png',
      quantity: 9,
      subtotalEth: '16.11',
    },
  ],
  networkFeeEth: '0.016',
  totalEth: '26.846',
};
