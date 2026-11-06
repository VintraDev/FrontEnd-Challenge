import type { Nft } from '@/contracts/catalog';
const names = [
  'Emerald Ape #042',
  'Sage Nomad #009',
  'Neon Vessel #552',
  'Cosmic Bloom #118',
  'Violet Nomad #314',
  'Ivory Baron #088',
  'Golden Beat #207',
  'Golden Signal #160',
  'Atlas #028',
];
const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
];
const images = [
  '/assets/nfts/image-import-1.webp',
  '/assets/nfts/image-import.webp',
  '/assets/nfts/image-import-3.webp',
  '/assets/nfts/image-import-2.webp',
];
const prices = ['1.19', '1.69', '1.99', '1.29', '1.39', '1.79', '0.99', '0.39', '2.19'];
export const catalog: Nft[] = Array.from({ length: 27 }, (_, index) => ({
  id: `nft-${index + 1}`,
  title:
    names[index % names.length] +
    (index >= names.length ? ` · ${Math.floor(index / names.length) + 1}` : ''),
  category: categories[index % categories.length],
  network: ['Ethereum', 'Polygon', 'Solana'][index % 3],
  image: images[index % images.length],
  priceEth: prices[index % prices.length],
}));
