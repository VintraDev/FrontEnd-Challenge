import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Nft } from '@/contracts/catalog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroCarouselProps {
  products: Nft[];
  isLoading: boolean;
}

export function HeroCarousel({ products, isLoading }: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const syncSelectedSlide = () => setSelected(api.selectedScrollSnap());
    api.on('select', syncSelectedSlide);
    api.on('reInit', syncSelectedSlide);
    const frame = requestAnimationFrame(syncSelectedSlide);
    return () => {
      cancelAnimationFrame(frame);
      api.off('select', syncSelectedSlide);
      api.off('reInit', syncSelectedSlide);
    };
  }, [api]);

  if (!products.length) {
    if (isLoading) {
      return (
        <section className="hero hero-carousel-empty" aria-busy={isLoading} aria-label="Destaques">
          <div className="hero-copy">
            <Skeleton className="hero-carousel-heading-skeleton" />
            <Skeleton className="hero-carousel-copy-skeleton" />
            <Skeleton className="hero-carousel-action-skeleton" />
          </div>
          <Skeleton className="hero-carousel-image-skeleton" />
        </section>
      );
    }

    return (
      <section className="hero" aria-label="Destaques">
        <div className="hero-copy">
          <p className="eyebrow">Bem-vindo à Kurio</p>
          <h1 className="desktop-hero-title">
            SEJA DONO DO FUTURO
            <br /> DA ARTE DIGITAL
          </h1>
          <h1 className="mobile-hero-title">
            SEJA DONO DA
            <br /> CULTURA DIGITAL
          </h1>
          <p className="desktop-hero-copy">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <p className="mobile-hero-copy">Descubra NFTs selecionados de criadores do mundo todo.</p>
          <a className="hero-link" href="#catalogo">
            EXPLORAR
          </a>
        </div>
        <img
          src="/assets/nfts/image-import-1.png"
          alt="Arte digital de um macaco com roupa verde"
        />
      </section>
    );
  }

  return (
    <Carousel
      className="hero-carousel"
      opts={{ loop: products.length > 1 }}
      setApi={setApi}
      aria-label="Destaques da Kurio"
    >
      <CarouselContent className="hero-carousel-content">
        {products.map((product, index) => {
          const isWelcomeSlide = index === 0;
          return (
            <CarouselItem key={product.id} className="hero-carousel-item">
              <section className="hero" aria-label={`Destaque: ${product.title}`}>
                <div className="hero-copy">
                  <p className="eyebrow">
                    {isWelcomeSlide ? 'Bem-vindo à Kurio' : `Em destaque · ${product.network}`}
                  </p>
                  <h1 className="desktop-hero-title">
                    {isWelcomeSlide ? (
                      <>
                        SEJA DONO DO FUTURO
                        <br /> DA ARTE DIGITAL
                      </>
                    ) : (
                      <>COLECIONE {product.title.toUpperCase()}</>
                    )}
                  </h1>
                  <h1 className="mobile-hero-title">
                    {isWelcomeSlide ? (
                      <>
                        SEJA DONO DA
                        <br /> CULTURA DIGITAL
                      </>
                    ) : (
                      product.title.toUpperCase()
                    )}
                  </h1>
                  <p className="desktop-hero-copy">
                    {isWelcomeSlide
                      ? 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.'
                      : `${product.category} na rede ${product.network}, disponível a partir de ${product.priceEth} ETH.`}
                  </p>
                  <p className="mobile-hero-copy">
                    {isWelcomeSlide
                      ? 'Descubra NFTs selecionados de criadores do mundo todo.'
                      : `${product.category} · ${product.priceEth} ETH`}
                  </p>
                  <Link className="hero-link" to="/nft/$nftId" params={{ nftId: product.id }}>
                    EXPLORAR
                  </Link>
                </div>
                <img src={product.image} alt={product.title} />
              </section>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {products.length > 1 && (
        <div className="hero-carousel-indicators" role="group" aria-label="Selecionar destaque">
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className="hero-carousel-indicator"
              aria-label={`Mostrar destaque ${index + 1}: ${product.title}`}
              aria-current={selected === index ? 'true' : undefined}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
}
