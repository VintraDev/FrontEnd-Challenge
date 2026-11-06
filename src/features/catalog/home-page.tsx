import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Search, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SiteHeader } from './components/site-header';
import { HeroCarousel } from './components/hero-carousel';
import { UnavailableAction } from '@/components/feedback/unavailable-action';
import { SiteFooter } from '@/components/layout/site-footer';
import { MobileNavigation } from './mobile-navigation';
import { Route } from '@/routes/index';
import { getCatalog } from './api';
import type { CatalogSearch } from '@/contracts/catalog';

const filterOptionClass =
  'flex cursor-pointer items-center gap-3 text-sm text-muted-foreground hover:text-foreground [&_input]:accent-primary';
const rangeInputClass =
  'pointer-events-none col-start-1 row-start-1 m-0 h-6 w-full appearance-none bg-transparent focus-visible:outline-none';
const productGridClass =
  'grid grid-cols-[repeat(3,minmax(0,1fr))] gap-x-8 gap-y-12 max-[1000px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[700px]:items-start max-[700px]:gap-x-4 max-[700px]:gap-y-6';
const cardOverlayClass =
  'absolute inset-0 z-1 size-full cursor-pointer rounded-[inherit] hover:bg-primary/6';
const promoArticleClass =
  'relative grid grid-cols-2 overflow-hidden rounded-md bg-surface max-[700px]:grid-cols-1';

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
const networks = ['Ethereum', 'Polygon', 'Solana'];
const stories = [
  [
    'Como funciona a propriedade de NFTs',
    'Aprenda a colecionar, negociar e verificar ativos digitais.',
  ],
  ['10 artistas digitais para acompanhar', 'Conheça criadores que moldam a cultura digital.'],
  [
    'Raridade, atributos e procedência',
    'Entenda raridade, procedência, direitos autorais e utilidade.',
  ],
  ['Como proteger sua carteira', 'Proteja sua carteira, seus ativos e sua identidade.'],
];
const featuredSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};
const priceRange = { min: 0.02, max: 12.3, step: 0.01 };
const clampPrice = (value: string, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(priceRange.max, Math.max(priceRange.min, parsed))
    : fallback;
};
const formatPrice = (value: number) => value.toFixed(2).replace('.', ',');
export function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery({
    queryKey: queryKeys.catalog(search),
    queryFn: ({ signal }) => getCatalog(search, signal),
  });
  const featured = useQuery({
    queryKey: queryKeys.catalog(featuredSearch),
    queryFn: ({ signal }) => getCatalog(featuredSearch, signal),
  });
  const selected = search.categories.split(',').filter(Boolean);
  const priceKey = `${search.minPrice}:${search.maxPrice}`;
  const [priceDraft, setPriceDraft] = useState({
    key: priceKey,
    min: search.minPrice,
    max: search.maxPrice,
  });
  const minPrice = priceDraft.key === priceKey ? priceDraft.min : search.minPrice;
  const maxPrice = priceDraft.key === priceKey ? priceDraft.max : search.maxPrice;
  const minRange = clampPrice(minPrice, priceRange.min);
  const maxRange = clampPrice(maxPrice, priceRange.max);
  const setMinPrice = (min: number) =>
    setPriceDraft({ key: priceKey, min: String(Math.min(min, maxRange)), max: String(maxRange) });
  const setMaxPrice = (max: number) =>
    setPriceDraft({ key: priceKey, min: String(minRange), max: String(Math.max(max, minRange)) });
  const update = (patch: Partial<CatalogSearch>) =>
    navigate({ search: { ...search, ...patch }, resetScroll: false });
  const filterContent = (
    <div className="filters bg-surface p-6">
      <h2 className="mb-4 text-lg font-bold">Coleções</h2>
      <fieldset className="mb-8 grid gap-3 max-[700px]:grid-cols-[repeat(2,minmax(0,1fr))]">
        <legend className="sr-only">Filtrar por coleção</legend>
        {categories.map((category) => (
          <label key={category} className={filterOptionClass}>
            <Checkbox
              checked={selected.includes(category)}
              onCheckedChange={(checked) =>
                update({
                  categories: (checked
                    ? [...selected, category]
                    : selected.filter((x) => x !== category)
                  ).join(','),
                  page: 1,
                })
              }
            />
            <span>{category}</span>
          </label>
        ))}
      </fieldset>
      <h2 className="mb-4 text-lg font-bold">Faixa de preço</h2>
      <form
        className="mb-8 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          update({ minPrice: String(minRange), maxPrice: String(maxRange), page: 1 });
        }}
      >
        <div
          className="price-range relative grid min-h-6 items-center"
          style={
            {
              '--price-range-start': `${((minRange - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
              '--price-range-end': `${100 - ((maxRange - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
            } as React.CSSProperties
          }
        >
          <span
            className="col-start-1 row-start-1 h-0.5 rounded-pill bg-border"
            aria-hidden="true"
          />
          <span
            className="col-start-1 row-start-1 mr-(--price-range-end) ml-(--price-range-start) h-0.5 rounded-pill bg-primary"
            aria-hidden="true"
          />
          <input
            aria-label="Preço mínimo"
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={priceRange.step}
            value={minRange}
            onChange={(event) => setMinPrice(Number(event.target.value))}
            className={rangeInputClass}
          />
          <input
            aria-label="Preço máximo"
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={priceRange.step}
            value={maxRange}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className={rangeInputClass}
          />
        </div>
        <output className="text-sm text-foreground" aria-live="polite">
          Preço: {formatPrice(minRange)} - {formatPrice(maxRange)} ETH
        </output>
        <Button type="submit" className="justify-self-start">
          Aplicar
        </Button>
      </form>
      <h2 className="mb-4 text-lg font-bold">Rede</h2>
      <fieldset className="mb-8 grid gap-3 max-[700px]:grid-cols-[repeat(2,minmax(0,1fr))]">
        <legend className="sr-only">Filtrar por rede</legend>
        {networks.map((network) => (
          <label key={network} className={filterOptionClass}>
            <input
              type="radio"
              name="network"
              checked={search.network === network}
              onChange={() => update({ network, page: 1 })}
            />
            <span>{network}</span>
          </label>
        ))}
      </fieldset>
      <Button
        variant="outline"
        onClick={() => {
          setPriceDraft({ key: ':', min: '', max: '' });
          update({ q: '', categories: '', network: '', minPrice: '', maxPrice: '', page: 1 });
        }}
      >
        Limpar filtros
      </Button>
    </div>
  );
  return (
    <div className="home-shell mx-auto max-w-[1440px] p-6 xl:px-[120px] max-[700px]:px-6 max-[700px]:pt-8 max-[700px]:pb-[calc(126px+env(safe-area-inset-bottom))]">
      <SiteHeader />
      <main id="inicio">
        <div className="relative hidden items-center gap-2 max-[700px]:flex">
          <Search
            size={19}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 text-primary"
          />
          <Input
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            value={search.q}
            onChange={(event) => update({ q: event.target.value, page: 1 })}
            className="min-h-[45px] border-0 bg-surface pl-12"
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Abrir filtros"
                className="min-h-[45px] min-w-[45px] rounded-lg p-2"
              >
                <SlidersHorizontal size={21} />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto [&_.filters]:bg-transparent">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Refine os NFTs por coleção, preço e rede.</SheetDescription>
              </SheetHeader>
              {filterContent}
            </SheetContent>
          </Sheet>
        </div>
        <HeroCarousel
          products={featured.data?.items.slice(0, 3) ?? []}
          isLoading={featured.isPending}
        />
        <section
          id="catalogo"
          className="mt-(--space-section) grid grid-cols-[310px_minmax(0,1fr)] gap-12 max-[1000px]:grid-cols-[240px_minmax(0,1fr)] max-[1000px]:gap-6 max-[700px]:mt-6 max-[700px]:block"
          aria-label="Catálogo de NFTs"
        >
          <aside className="flex flex-col gap-6 max-[700px]:hidden">
            {filterContent}
            <div className="relative overflow-hidden bg-surface-raised pt-6 text-center max-[700px]:hidden">
              <UnavailableAction title="NFT em destaque" className={cardOverlayClass}>
                <span className="sr-only">Saiba mais sobre o NFT em destaque</span>
              </UnavailableAction>
              <p className="text-xl font-bold text-primary">NFT EM DESTAQUE</p>
              <strong className="m-4 block">OFERTA LIMITADA</strong>
              <img
                src="/assets/nfts/image-import.webp"
                alt="Arte digital de colecionável"
                width={640}
                height={640}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </div>
          </aside>
          <div className="min-w-0">
            <div className="mb-8 flex items-center justify-between gap-4 max-[1000px]:flex-wrap max-[700px]:mb-4">
              <div>
                <div className="hidden flex-wrap items-center gap-3 text-xs max-[700px]:flex">
                  <h2 className="m-0 border-b-2 border-primary-hover text-xs font-bold text-primary">
                    Todos os NFTs
                  </h2>
                  <span className="text-muted-foreground">Novos lançamentos</span>
                  <span className="text-muted-foreground">Em alta</span>
                </div>
                <h2 className="font-bold text-primary max-[700px]:hidden">Todos os NFTs</h2>
                <p className="text-xs text-muted-foreground">
                  {query.isSuccess ? `${query.data.total} resultados` : 'Explore a coleção'}
                </p>
              </div>
              <div className="flex items-center gap-3 max-[1000px]:flex-wrap max-[700px]:w-full">
                <div className="flex items-center gap-2 max-[700px]:hidden">
                  <Search size={16} />
                  <Input
                    id="busca"
                    aria-label="Buscar NFTs"
                    placeholder="Buscar NFTs"
                    value={search.q}
                    onChange={(event) => update({ q: event.target.value, page: 1 })}
                    className="min-w-[140px]"
                  />
                </div>
                <Select
                  value={search.sort}
                  onValueChange={(value) =>
                    update({ sort: value as CatalogSearch['sort'], page: 1 })
                  }
                >
                  <SelectTrigger aria-label="Ordenar por">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Listados recentemente</SelectItem>
                    <SelectItem value="price-asc">Menor preço</SelectItem>
                    <SelectItem value="price-desc">Maior preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {query.isPending ? (
              <div className={productGridClass} aria-label="Carregando catálogo">
                {Array.from({ length: 9 }, (_, i) => (
                  <Skeleton key={i} className="h-[340px] bg-surface-raised" />
                ))}
              </div>
            ) : query.isError ? (
              <div role="alert" className="grid justify-items-start gap-4 py-12">
                <p>Não foi possível carregar os NFTs.</p>
                <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
              </div>
            ) : query.data.items.length === 0 ? (
              <div className="grid justify-items-start gap-4 py-12">
                <p>Nenhum NFT encontrado para estes filtros.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPriceDraft({ key: ':', min: '', max: '' });
                    update({
                      q: '',
                      categories: '',
                      network: '',
                      minPrice: '',
                      maxPrice: '',
                      page: 1,
                    });
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <>
                <div className={productGridClass}>
                  {query.data.items.map((nft, index) => (
                    <Card
                      key={nft.id}
                      className="nft-card gap-0 border-0 bg-transparent p-0 text-foreground shadow-none max-[700px]:even:translate-y-8"
                    >
                      <CardContent className="p-0">
                        <Link
                          to="/nft/$nftId"
                          params={{ nftId: nft.id }}
                          className="nft-card-link group block text-inherit no-underline"
                        >
                          <span className="block bg-surface px-1 py-6 max-[700px]:rounded-lg max-[700px]:p-2">
                            <span className="block overflow-hidden rounded-lg">
                              <img
                                src={nft.image}
                                alt={`Arte de ${nft.title}`}
                                width={640}
                                height={640}
                                loading={index < 2 ? undefined : 'lazy'}
                                fetchPriority={index < 2 ? 'high' : undefined}
                                decoding="async"
                                className="aspect-square w-full rounded-lg object-cover transition-transform duration-(--duration-fast) ease-(--ease-standard) group-hover:scale-(--image-hover-scale) group-focus-visible:scale-(--image-hover-scale) max-[700px]:rounded-md motion-reduce:group-hover:transform-none motion-reduce:group-focus-visible:transform-none"
                              />
                            </span>
                          </span>
                          <h3 className="mt-3 text-base group-hover:text-primary max-[700px]:text-sm">
                            {nft.title}
                          </h3>
                          <p className="mt-2 text-lg font-bold text-primary max-[700px]:text-base">
                            {nft.priceEth} ETH
                          </p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <nav
                  className="mt-12 flex justify-end gap-2 max-[700px]:mt-16"
                  aria-label="Paginação"
                >
                  {Array.from({ length: query.data.totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={search.page === i + 1 ? 'default' : 'outline'}
                      aria-current={search.page === i + 1 ? 'page' : undefined}
                      onClick={() => update({ page: i + 1 })}
                      className="min-w-12 p-2"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </nav>
              </>
            )}
          </div>
        </section>
        <section
          className="promos mt-(--space-section) grid grid-cols-[repeat(2,minmax(0,1fr))] gap-6 max-[700px]:grid-cols-[minmax(0,1fr)]"
          aria-label="Destaques"
        >
          <article className={promoArticleClass}>
            <UnavailableAction
              title="Lançamentos gênesis de edição limitada"
              className={cardOverlayClass}
            >
              <span className="sr-only">
                Saiba mais sobre lançamentos gênesis de edição limitada
              </span>
            </UnavailableAction>
            <img
              src="/assets/nfts/image-import-1.webp"
              alt=""
              width={640}
              height={640}
              loading="lazy"
              decoding="async"
              className="h-[250px] w-full object-cover"
            />
            <div className="p-6 text-right">
              <h2 className="text-lg font-bold">Lançamentos gênesis de edição limitada</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Colecione edições escassas diretamente dos criadores antes da revelação pública.
              </p>
            </div>
          </article>
          <article className={promoArticleClass}>
            <UnavailableAction
              title="Arte digital selecionada e muito mais"
              className={cardOverlayClass}
            >
              <span className="sr-only">Saiba mais sobre arte digital selecionada</span>
            </UnavailableAction>
            <img
              src="/assets/nfts/image-import-3.webp"
              alt=""
              width={640}
              height={640}
              loading="lazy"
              decoding="async"
              className="h-[250px] w-full object-cover"
            />
            <div className="p-6 text-right">
              <h2 className="text-lg font-bold">Arte digital selecionada e muito mais</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
              </p>
            </div>
          </article>
        </section>
        <section className="journal mt-(--space-section) text-center">
          <h2 className="text-2xl font-bold">Diário da Cunhagem</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
          <div className="journal-grid mt-8 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-6 text-left max-[700px]:grid-cols-[minmax(0,1fr)]">
            {stories.map(([title, description], i) => (
              <Card
                key={title}
                className="relative overflow-hidden border-border bg-surface pt-0 pb-6 text-foreground"
              >
                <UnavailableAction title={title} className={cardOverlayClass}>
                  <span className="sr-only">Saiba mais: {title}</span>
                </UnavailableAction>
                <img
                  src={`/assets/nfts/${['image-import-1.webp', 'image-import.webp', 'image-import-3.webp', 'image-import-2.webp'][i]}`}
                  alt=""
                  width={640}
                  height={640}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[1.5] w-full object-cover"
                />
                <CardContent>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    Em breve <ArrowRight size={14} />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileNavigation />
    </div>
  );
}
