import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Nft } from '@/contracts/catalog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface HeroCarouselProps {
  products: Nft[];
  isLoading: boolean;
}

const heroSectionClass =
  'hero grid grid-cols-[1fr_450px] items-center gap-12 overflow-hidden rounded-xl bg-surface max-[1000px]:grid-cols-[1fr_40%] max-[700px]:min-h-[190px] max-[700px]:grid-cols-[minmax(0,1fr)_38%] max-[700px]:gap-2 max-[700px]:rounded-md max-[700px]:bg-surface-raised';
const heroCopyClass = 'hero-copy py-8 pr-8 pl-12 max-[700px]:p-4';
const eyebrowClass = 'eyebrow font-bold text-foreground max-[700px]:text-xs';
const desktopTitleClass =
  'desktop-hero-title my-2 text-[clamp(2rem,3vw,var(--font-size-display))] leading-[1.4] font-bold max-[700px]:hidden';
const mobileTitleClass =
  'mobile-hero-title my-2 hidden text-lg leading-[1.6] font-bold max-[700px]:block';
const desktopCopyClass =
  'desktop-hero-copy text-sm leading-[1.7] text-muted-foreground max-[700px]:hidden';
const mobileCopyClass =
  'mobile-hero-copy hidden text-xs leading-[1.7] text-muted-foreground max-[700px]:block';
const heroLinkClass =
  'hero-link mt-8 inline-flex rounded-md bg-primary px-8 py-3 font-bold text-primary-foreground no-underline min-[701px]:hover:bg-(--button-primary-hover-bg) max-[700px]:mt-2 max-[700px]:bg-transparent max-[700px]:p-0 max-[700px]:text-xs max-[700px]:text-primary max-[700px]:hover:text-foreground';
const heroImageClass =
  'h-[450px] w-full rounded-xl object-cover max-[700px]:aspect-square max-[700px]:h-auto max-[700px]:w-[calc(100%-var(--space-4))] max-[700px]:rounded-lg';

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
    return (
      <section
        className={`${heroSectionClass} max-[700px]:mt-4`}
        aria-busy={isLoading || undefined}
        aria-label="Destaques"
      >
        <div className={heroCopyClass}>
          <p className={eyebrowClass}>Bem-vindo à Kurio</p>
          <h1 className={desktopTitleClass}>
            SEJA DONO DO FUTURO
            <br /> DA ARTE DIGITAL
          </h1>
          <h1 className={mobileTitleClass}>
            SEJA DONO DA
            <br /> CULTURA DIGITAL
          </h1>
          <p className={desktopCopyClass}>
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <p className={mobileCopyClass}>Descubra NFTs selecionados de criadores do mundo todo.</p>
          <a className={heroLinkClass} href="#catalogo">
            EXPLORAR
          </a>
        </div>
        <img
          src="/assets/nfts/image-import-1.webp"
          alt="Arte digital de um macaco com roupa verde"
          width={640}
          height={640}
          fetchPriority="high"
          className={heroImageClass}
        />
      </section>
    );
  }

  return (
    <Carousel
      className="hero-carousel mt-8 max-[700px]:mt-4"
      opts={{ loop: products.length > 1 }}
      setApi={setApi}
      aria-label="Destaques da Kurio"
    >
      <CarouselContent className="hero-carousel-content ml-0">
        {products.map((product, index) => {
          const isWelcomeSlide = index === 0;
          return (
            <CarouselItem key={product.id} className="hero-carousel-item pl-0">
              <section className={heroSectionClass} aria-label={`Destaque: ${product.title}`}>
                <div className={heroCopyClass}>
                  <p className={eyebrowClass}>
                    {isWelcomeSlide ? 'Bem-vindo à Kurio' : `Em destaque · ${product.network}`}
                  </p>
                  <h1 className={desktopTitleClass}>
                    {isWelcomeSlide ? (
                      <>
                        SEJA DONO DO FUTURO
                        <br /> DA ARTE DIGITAL
                      </>
                    ) : (
                      <>COLECIONE {product.title.toUpperCase()}</>
                    )}
                  </h1>
                  <h1 className={mobileTitleClass}>
                    {isWelcomeSlide ? (
                      <>
                        SEJA DONO DA
                        <br /> CULTURA DIGITAL
                      </>
                    ) : (
                      product.title.toUpperCase()
                    )}
                  </h1>
                  <p className={desktopCopyClass}>
                    {isWelcomeSlide
                      ? 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.'
                      : `${product.category} na rede ${product.network}, disponível a partir de ${product.priceEth} ETH.`}
                  </p>
                  <p className={mobileCopyClass}>
                    {isWelcomeSlide
                      ? 'Descubra NFTs selecionados de criadores do mundo todo.'
                      : `${product.category} · ${product.priceEth} ETH`}
                  </p>
                  <Link
                    className={heroLinkClass}
                    to="/nft/$nftId"
                    params={{ nftId: product.id }}
                    aria-label={`Explorar ${product.title}`}
                  >
                    EXPLORAR
                  </Link>
                </div>
                <img
                  src={product.image}
                  alt={product.title}
                  width={640}
                  height={640}
                  fetchPriority={isWelcomeSlide ? 'high' : 'low'}
                  loading={isWelcomeSlide ? undefined : 'lazy'}
                  decoding={isWelcomeSlide ? undefined : 'async'}
                  className={heroImageClass}
                />
              </section>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {products.length > 1 && (
        <div
          className="hero-carousel-indicators absolute bottom-6 left-1/2 z-1 flex -translate-x-1/2 items-center gap-1 max-[700px]:bottom-3"
          role="group"
          aria-label="Selecionar destaque"
        >
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className="hero-carousel-indicator box-content size-2 cursor-pointer rounded-pill border-0 bg-primary-hover bg-clip-content p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=true]:bg-foreground"
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
