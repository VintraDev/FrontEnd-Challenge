import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from './components/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { addItem } from '@/features/cart/api';
import { FavoriteButton } from '@/features/favorites/favorite-button';
import { getCatalog, getNft } from './api';
import type { NftDetail } from '@/contracts/catalog';
import './home.css';
import './nft-detail.css';

const initialSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};
export function NftDetailPage({ nftId }: { nftId: string }) {
  const detail = useQuery({
    queryKey: queryKeys.nft(nftId),
    queryFn: ({ signal }) => getNft(nftId, signal),
    retry: false,
  });
  return (
    <div className="home-shell detail-shell">
      <SiteHeader />
      <main>
        <div className="detail-mobile-back">
          <Link to="/" search={initialSearch} aria-label="Voltar ao catálogo">
            <ArrowLeft size={20} />
          </Link>
          {detail.data && <FavoriteButton nft={detail.data} className="detail-mobile-favorite" />}
        </div>
        <nav aria-label="Trilha de navegação" className="detail-breadcrumb">
          <Link to="/" search={initialSearch}>
            Início
          </Link>{' '}
          /{' '}
          <Link to="/" search={initialSearch}>
            Mercado
          </Link>
        </nav>
        {detail.isPending ? (
          <div className="detail-loading" aria-label="Carregando NFT">
            <Skeleton className="detail-skeleton" />
            <Skeleton className="detail-skeleton" />
          </div>
        ) : detail.isError ? (
          <section role="alert" className="detail-error">
            <h1>
              {axios.isAxiosError(detail.error) && detail.error.response?.status === 404
                ? 'NFT não encontrado'
                : 'Não foi possível carregar o NFT'}
            </h1>
            <p>Verifique o endereço ou tente novamente.</p>
            <Button onClick={() => void detail.refetch()}>Tentar novamente</Button>{' '}
            <Link to="/" search={initialSearch}>
              Voltar ao catálogo
            </Link>
          </section>
        ) : (
          <DetailContent nft={detail.data} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
function DetailContent({ nft }: { nft: NftDetail }) {
  const [editionId, setEditionId] = useState(
    () => nft.editions.find((edition) => edition.available > 0)?.id ?? nft.editions[0].id,
  );
  const [quantity, setQuantity] = useState(1);
  const client = useQueryClient();
  const add = useMutation({
    mutationFn: addItem,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.cart('guest') });
    },
  });
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0];
  const related = useQuery({
    queryKey: queryKeys.catalog(initialSearch),
    queryFn: ({ signal }) => getCatalog(initialSearch, signal),
  });
  return (
    <>
      <section className="nft-detail">
        <div className="detail-gallery">
          <div className="detail-thumbnail">
            <img src={nft.image} alt="" />
          </div>
          <div className="detail-image">
            <img src={nft.image} alt={`Arte de ${nft.title}`} />
          </div>
        </div>
        <div className="detail-info">
          <div className="detail-heading">
            <h1>{nft.title}</h1>
            <p className="detail-price">{edition.priceEth} ETH</p>
          </div>
          <div>
            <h2>Sobre este NFT:</h2>
            <p className="detail-muted">{nft.description}</p>
          </div>
          <fieldset className="detail-editions">
            <legend>Edição:</legend>
            {nft.editions.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                aria-pressed={editionId === item.id}
                disabled={item.available === 0}
                onClick={() => {
                  setEditionId(item.id);
                  setQuantity(1);
                }}
              >
                {item.label}
                {item.available === 0 && <span className="sr-only"> esgotada</span>}
              </Button>
            ))}
          </fieldset>
          <p className="detail-muted" role="status">
            {edition.available > 0 ? `${edition.available} disponíveis` : 'Edição esgotada'}
          </p>
          <div className="detail-actions">
            <div className="quantity-control" aria-label="Quantidade">
              <span className="detail-mobile-quantity-label">Qtd.</span>
              <Button
                aria-label="Diminuir quantidade"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1 || edition.available === 0}
              >
                <Minus size={16} />
              </Button>
              <output aria-live="polite">{quantity}</output>
              <Button
                aria-label="Aumentar quantidade"
                onClick={() => setQuantity((value) => Math.min(edition.available, value + 1))}
                disabled={quantity >= edition.available || edition.available === 0}
              >
                <Plus size={16} />
              </Button>
            </div>
            <p className="detail-mobile-bar-price">{edition.priceEth} ETH</p>
            <Button
              className="detail-add-button"
              disabled={edition.available === 0 || add.isPending}
              onClick={() => add.mutate({ nftId: nft.id, editionId: edition.id, quantity })}
            >
              {add.isPending ? 'Adicionando...' : 'ADICIONAR AO CARRINHO'}
            </Button>
            <FavoriteButton nft={nft} className="detail-desktop-favorite" />
            <Link to="/cart" className="detail-mobile-cart" aria-label="Abrir carrinho">
              <ShoppingBag size={20} />
            </Link>
          </div>
          <p className="detail-muted" role="status">
            {add.isSuccess ? (
              <>
                Item adicionado. <Link to="/cart">Ver carrinho</Link>
              </>
            ) : (
              ''
            )}
          </p>
          {add.isError && (
            <p role="alert">
              Não foi possível adicionar. Verifique a quantidade disponível no carrinho.
            </p>
          )}
          <div className="detail-meta">
            <p>ID do token: {nft.id}</p>
            <p>Categoria: {nft.category}</p>
            <p>Rede: {nft.network}</p>
          </div>
        </div>
      </section>
      <section className="detail-description">
        <h2>Descrição do NFT</h2>
        <p>{nft.description}</p>
        <h3>Rede:</h3>
        <p>{nft.network} — dados de demonstração.</p>
      </section>
      <section className="detail-related">
        <h2>Mais NFTs</h2>
        {related.isPending ? (
          <p>Carregando NFTs...</p>
        ) : related.isError ? (
          <p>Não foi possível carregar outros NFTs.</p>
        ) : (
          <div className="detail-related-grid">
            {related.data.items
              .filter((item) => item.id !== nft.id)
              .slice(0, 5)
              .map((item) => (
                <article key={item.id}>
                  <Link to="/nft/$nftId" params={{ nftId: item.id }}>
                    <span className="related-image">
                      <img src={item.image} alt={`Arte de ${item.title}`} loading="lazy" />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.priceEth} ETH</p>
                  </Link>
                </article>
              ))}
          </div>
        )}
      </section>
    </>
  );
}
