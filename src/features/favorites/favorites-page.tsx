import { Link } from '@tanstack/react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { useChangeFavorite, useFavorites } from './hooks';
import '@/features/catalog/home.css';
import '@/features/profile/profile.css';
import './favorites.css';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};
export function FavoritesPage({ userId }: { userId: string }) {
  const favorites = useFavorites(userId);
  const change = useChangeFavorite(userId);
  return (
    <div className="home-shell favorites-shell">
      <SiteHeader />
      <main className="profile-layout">
        <AccountSidebar active="favorites" />
        <section className="favorites-main">
          <Link to="/" search={homeSearch} className="favorites-back">
            ← Voltar ao catálogo
          </Link>
          <h1>Meus favoritos</h1>
          <p className="favorites-description">Os NFTs que você salvou para encontrar novamente.</p>
          {favorites.isPending ? (
            <div className="product-grid" aria-label="Carregando favoritos">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="product-skeleton" />
              ))}
            </div>
          ) : favorites.isError ? (
            <section role="alert" className="favorites-feedback">
              <p>Não foi possível carregar seus favoritos.</p>
              <Button onClick={() => void favorites.refetch()}>Tentar novamente</Button>
            </section>
          ) : favorites.data.items.length === 0 ? (
            <section className="favorites-feedback">
              <h2>Você ainda não tem favoritos</h2>
              <p>Explore o catálogo e salve os NFTs que chamarem sua atenção.</p>
              <Link to="/" search={homeSearch} className={buttonVariants()}>
                Explorar NFTs
              </Link>
            </section>
          ) : (
            <div className="product-grid">
              {favorites.data.items.map((nft) => (
                <Card key={nft.id} className="nft-card">
                  <CardContent className="nft-content">
                    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-card-link">
                      <span className="nft-image">
                        <span className="nft-image-clip">
                          <img src={nft.image} alt={`Arte de ${nft.title}`} loading="lazy" />
                        </span>
                      </span>
                      <h2>{nft.title}</h2>
                      <p>{nft.priceEth} ETH</p>
                    </Link>
                    <Button
                      variant="outline"
                      disabled={change.isPending}
                      aria-label={`Remover ${nft.title} dos favoritos`}
                      onClick={() => change.mutate({ nft, add: false })}
                    >
                      Remover dos favoritos
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {change.isError && (
            <p role="alert" className="favorites-error">
              Não foi possível remover o NFT. Tente novamente.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
