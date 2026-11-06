import { Link } from '@tanstack/react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { useChangeFavorite, useFavorites } from './hooks';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const gridClass =
  'grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[700px]:grid-cols-[minmax(0,1fr)]';

export function FavoritesPage({ userId }: { userId: string }) {
  const favorites = useFavorites(userId);
  const change = useChangeFavorite(userId);
  return (
    <div className="home-shell favorites-shell mx-auto max-w-[1440px] px-16 pt-12 pb-16 max-[700px]:px-4 max-[700px]:pt-6 max-[700px]:pb-12">
      <SiteHeader />
      <main className="profile-layout mt-8 grid grid-cols-[310px_minmax(0,1fr)] items-start gap-8 max-[700px]:mt-0 max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-6">
        <AccountSidebar active="favorites" />
        <section className="favorites-main min-h-[70vh] pb-16">
          <Link to="/" search={homeSearch} className="text-muted-foreground max-[700px]:hidden">
            ← Voltar ao catálogo
          </Link>
          <h1 className="mt-8 text-2xl leading-(--line-height-heading) font-bold max-[700px]:mt-0 max-[700px]:text-xl">
            Meus favoritos
          </h1>
          <p className="mt-3 mb-8 text-muted-foreground">
            Os NFTs que você salvou para encontrar novamente.
          </p>
          {favorites.isPending ? (
            <div className={gridClass} aria-label="Carregando favoritos">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-80 bg-surface" />
              ))}
            </div>
          ) : favorites.isError ? (
            <section role="alert" className="grid justify-items-start gap-4 py-12">
              <p className="text-muted-foreground">Não foi possível carregar seus favoritos.</p>
              <Button onClick={() => void favorites.refetch()}>Tentar novamente</Button>
            </section>
          ) : favorites.data.items.length === 0 ? (
            <section className="grid justify-items-start gap-4 py-12">
              <h2 className="text-xl font-bold">Você ainda não tem favoritos</h2>
              <p className="text-muted-foreground">
                Explore o catálogo e salve os NFTs que chamarem sua atenção.
              </p>
              <Link to="/" search={homeSearch} className={buttonVariants()}>
                Explorar NFTs
              </Link>
            </section>
          ) : (
            <div className={gridClass}>
              {favorites.data.items.map((nft) => (
                <Card
                  key={nft.id}
                  className="nft-card gap-0 rounded-none border-0 border-b-8 border-primary-hover bg-surface p-0 text-foreground shadow-none"
                >
                  <CardContent className="nft-content flex flex-col gap-3 p-4">
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: nft.id }}
                      className="nft-card-link group block text-foreground no-underline"
                    >
                      <span className="nft-image block border border-primary-hover p-2">
                        <span className="nft-image-clip block overflow-hidden">
                          <img
                            src={nft.image}
                            alt={`Arte de ${nft.title}`}
                            loading="lazy"
                            className="aspect-square w-full object-cover transition-transform duration-(--duration-base) ease-(--ease-standard) group-hover:scale-(--image-hover-scale) group-focus-visible:scale-(--image-hover-scale) motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
                          />
                        </span>
                      </span>
                      <h2 className="mt-3 text-lg font-bold">{nft.title}</h2>
                      <p className="mt-1 font-mono text-primary">{nft.priceEth} ETH</p>
                    </Link>
                    <Button
                      variant="outline"
                      disabled={change.isPending}
                      aria-label={`Remover ${nft.title} dos favoritos`}
                      onClick={() => change.mutate({ nft, add: false })}
                      className="mt-4 w-full"
                    >
                      Remover dos favoritos
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {change.isError && (
            <p role="alert" className="mt-4 text-destructive">
              Não foi possível remover o NFT. Tente novamente.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
