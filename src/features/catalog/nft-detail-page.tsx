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
import { useSession } from '@/features/auth/session';
import { FavoriteButton } from '@/features/favorites/favorite-button';
import { getCatalog, getNft } from './api';
import type { NftDetail } from '@/contracts/catalog';

const initialSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const mobileCircleActionClass =
  'grid size-11 min-h-11 place-items-center rounded-pill bg-surface-raised p-0 text-muted-foreground';

export function NftDetailPage({ nftId }: { nftId: string }) {
  const detail = useQuery({
    queryKey: queryKeys.nft(nftId),
    queryFn: ({ signal }) => getNft(nftId, signal),
    retry: false,
  });
  return (
    <div className="home-shell detail-shell mx-auto max-w-[1440px] px-16 pt-12 pb-16 max-[700px]:p-0 max-[700px]:pb-[calc(220px+env(safe-area-inset-bottom))] [&_.site-footer]:max-[700px]:mx-6 [&_.site-footer]:max-[700px]:mt-12">
      <SiteHeader />
      <main className="max-[700px]:relative">
        <div className="hidden max-[700px]:absolute max-[700px]:top-6 max-[700px]:right-6 max-[700px]:left-6 max-[700px]:z-2 max-[700px]:flex max-[700px]:justify-between">
          <Link
            to="/"
            search={initialSearch}
            aria-label="Voltar ao catálogo"
            className={mobileCircleActionClass}
          >
            <ArrowLeft size={20} />
          </Link>
          {detail.data && (
            <FavoriteButton
              nft={detail.data}
              className={`${mobileCircleActionClass} [&_span]:hidden`}
            />
          )}
        </div>
        <nav
          aria-label="Trilha de navegação"
          className="mt-8 mb-3 text-sm font-bold max-[700px]:hidden [&_a]:text-foreground"
        >
          <Link to="/" search={initialSearch}>
            Início
          </Link>{' '}
          /{' '}
          <Link to="/" search={initialSearch}>
            Mercado
          </Link>
        </nav>
        {detail.isPending ? (
          <div
            className="grid grid-cols-2 gap-8 max-[700px]:mx-6 max-[700px]:mt-16 max-[700px]:grid-cols-1"
            aria-label="Carregando NFT"
          >
            <Skeleton className="h-[400px] bg-surface-raised" />
            <Skeleton className="h-[400px] bg-surface-raised" />
          </div>
        ) : detail.isError ? (
          <section
            role="alert"
            className="grid justify-items-start gap-4 py-12 max-[700px]:mx-6 max-[700px]:mt-16"
          >
            <h1 className="text-xl font-bold">
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
  const session = useSession();
  const gallery = Array.from(new Set([nft.image, ...nft.images].filter(Boolean)));
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [editionId, setEditionId] = useState(
    () => nft.editions.find((edition) => edition.available > 0)?.id ?? nft.editions[0].id,
  );
  const [quantity, setQuantity] = useState(1);
  const client = useQueryClient();
  const add = useMutation({
    mutationFn: addItem,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: queryKeys.cart(session.data?.user.id ?? 'guest'),
      });
    },
  });
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0];
  const related = useQuery({
    queryKey: queryKeys.catalog(initialSearch),
    queryFn: ({ signal }) => getCatalog(initialSearch, signal),
  });
  return (
    <>
      <section className="nft-detail grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 max-[700px]:block">
        <div className="detail-gallery grid grid-cols-[100px_minmax(0,1fr)] items-start gap-6 max-[700px]:block max-[700px]:bg-linear-[140deg] max-[700px]:from-surface max-[700px]:to-surface-raised max-[700px]:px-6 max-[700px]:pt-18 max-[700px]:pb-16">
          <div
            className="detail-thumbnail rounded-md border border-primary-hover bg-surface p-1 max-[700px]:hidden"
            role="group"
            aria-label={`Galeria de ${nft.title}`}
          >
            {gallery.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Mostrar imagem ${index + 1} de ${nft.title}`}
                aria-pressed={selectedImage === image}
                onClick={() => setSelectedImage(image)}
                className="block cursor-pointer border border-transparent bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[pressed=true]:border-primary"
              >
                <img src={image} alt="" className="aspect-square w-full rounded-lg object-cover" />
              </button>
            ))}
          </div>
          <div className="detail-image rounded-md bg-surface p-4 max-[700px]:bg-transparent max-[700px]:p-0">
            <img
              src={selectedImage}
              alt={`Arte de ${nft.title}`}
              className="aspect-square w-full rounded-lg object-cover max-[700px]:rounded-xl"
            />
          </div>
        </div>
        <div className="detail-info flex flex-col gap-4 max-[700px]:relative max-[700px]:-mt-28 max-[700px]:rounded-t-xl max-[700px]:bg-surface max-[700px]:px-6 max-[700px]:pt-8 max-[700px]:pb-6">
          <div className="border-b border-primary-hover pb-3 max-[700px]:border-0 max-[700px]:p-0">
            <h1 className="text-2xl leading-(--line-height-heading) font-bold max-[700px]:text-xl">
              {nft.title}
            </h1>
            <p className="mt-3 text-xl font-bold text-primary max-[700px]:hidden">
              {edition.priceEth} ETH
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold max-[700px]:sr-only">Sobre este NFT:</h2>
            <p className="text-sm leading-[1.7] text-muted-foreground">{nft.description}</p>
          </div>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-3 text-sm font-bold">Edição:</legend>
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
                className="min-h-8 rounded-pill px-3 py-2 aria-[pressed=true]:border-primary aria-[pressed=true]:bg-surface-raised aria-[pressed=true]:text-primary max-[700px]:min-h-11"
              >
                {item.label}
                {item.available === 0 && <span className="sr-only"> esgotada</span>}
              </Button>
            ))}
          </fieldset>
          <p className="text-sm leading-[1.7] text-muted-foreground" role="status">
            {edition.available > 0 ? `${edition.available} disponíveis` : 'Edição esgotada'}
          </p>
          <div className="flex flex-wrap items-center gap-3 max-[700px]:fixed max-[700px]:right-0 max-[700px]:bottom-0 max-[700px]:left-0 max-[700px]:z-40 max-[700px]:grid max-[700px]:grid-cols-[minmax(0,1fr)_60px] max-[700px]:gap-x-3 max-[700px]:gap-y-4 max-[700px]:rounded-t-pill max-[700px]:bg-surface max-[700px]:px-6 max-[700px]:pt-4 max-[700px]:pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] max-[700px]:shadow-[0_-6px_18px_color-mix(in_srgb,var(--bg-canvas)_45%,transparent)]">
            <div
              className="flex items-center gap-3 max-[700px]:col-start-1 max-[700px]:row-start-1"
              aria-label="Quantidade"
            >
              <span className="hidden max-[700px]:inline max-[700px]:text-sm max-[700px]:text-muted-foreground">
                Qtd.
              </span>
              <Button
                aria-label="Diminuir quantidade"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1 || edition.available === 0}
                className="min-w-12 gap-2 rounded-pill p-2"
              >
                <Minus size={16} />
              </Button>
              <output aria-live="polite" className="min-w-4 text-center">
                {quantity}
              </output>
              <Button
                aria-label="Aumentar quantidade"
                onClick={() => setQuantity((value) => Math.min(edition.available, value + 1))}
                disabled={quantity >= edition.available || edition.available === 0}
                className="min-w-12 gap-2 rounded-pill p-2"
              >
                <Plus size={16} />
              </Button>
            </div>
            <p className="hidden max-[700px]:col-start-2 max-[700px]:row-start-1 max-[700px]:block max-[700px]:justify-self-end max-[700px]:text-lg max-[700px]:font-bold max-[700px]:whitespace-nowrap max-[700px]:text-primary">
              {edition.priceEth} ETH
            </p>
            <Button
              className="gap-2 max-[700px]:col-start-1 max-[700px]:row-start-2 max-[700px]:min-h-[60px] max-[700px]:rounded-pill"
              disabled={edition.available === 0 || add.isPending}
              onClick={() => add.mutate({ nftId: nft.id, editionId: edition.id, quantity })}
            >
              {add.isPending ? 'Adicionando...' : 'ADICIONAR AO CARRINHO'}
            </Button>
            <FavoriteButton nft={nft} className="gap-2 max-[700px]:hidden" />
            <Link
              to="/cart"
              className="hidden max-[700px]:col-start-2 max-[700px]:row-start-2 max-[700px]:grid max-[700px]:size-[60px] max-[700px]:place-items-center max-[700px]:rounded-pill max-[700px]:bg-surface-raised max-[700px]:text-foreground"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag size={20} />
            </Link>
          </div>
          <p className="text-sm leading-[1.7] text-muted-foreground" role="status">
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
          <div className="text-sm leading-[1.7] text-muted-foreground">
            <p>ID do token: {nft.id}</p>
            <p>Categoria: {nft.category}</p>
            <p>Rede: {nft.network}</p>
          </div>
        </div>
      </section>
      <section className="mt-(--space-section) max-[700px]:mx-6 max-[700px]:mt-8">
        <h2 className="mb-4 border-b border-primary-hover pb-3 font-bold text-primary">
          Descrição do NFT
        </h2>
        <p className="text-sm leading-[1.7] text-muted-foreground">{nft.description}</p>
        <h3 className="mt-6 text-sm font-bold">Rede:</h3>
        <p className="text-sm leading-[1.7] text-muted-foreground">
          {nft.network} — dados de demonstração.
        </p>
      </section>
      <section className="mt-(--space-section) max-[700px]:mx-6 max-[700px]:mt-8">
        <h2 className="mb-4 border-b border-primary-hover pb-3 font-bold text-primary">
          Mais NFTs
        </h2>
        {related.isPending ? (
          <p>Carregando NFTs...</p>
        ) : related.isError ? (
          <p>Não foi possível carregar outros NFTs.</p>
        ) : (
          <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-6 max-[700px]:grid-cols-[repeat(2,minmax(0,1fr))]">
            {related.data.items
              .filter((item) => item.id !== nft.id)
              .slice(0, 5)
              .map((item) => (
                <article key={item.id}>
                  <Link to="/nft/$nftId" params={{ nftId: item.id }}>
                    <span className="related-image">
                      <img
                        src={item.image}
                        alt={`Arte de ${item.title}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-md border-8 border-surface object-cover"
                      />
                    </span>
                    <h3 className="mt-3 text-sm">{item.title}</h3>
                    <p className="font-bold text-primary">{item.priceEth} ETH</p>
                  </Link>
                </article>
              ))}
          </div>
        )}
      </section>
    </>
  );
}
