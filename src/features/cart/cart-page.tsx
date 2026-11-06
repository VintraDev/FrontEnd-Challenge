import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { getCatalog } from '@/features/catalog/api';
import { useSession } from '@/features/auth/session';
import { applyCoupon, getCart, getQuote, removeCoupon, removeItem, updateItem } from './api';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const qtyButtonClass =
  'min-h-8 min-w-8 rounded-pill p-1 max-[700px]:min-h-10 max-[700px]:min-w-10 max-[360px]:min-w-9';
const reviewCtaClass = 'max-[700px]:min-h-[60px] max-[700px]:rounded-pill';

function message(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.error?.message === 'string'
    ? error.response.data.error.message
    : 'Não foi possível atualizar o carrinho. Tente novamente.';
}
export function CartPage() {
  const client = useQueryClient();
  const session = useSession();
  const scope = session.data?.user.id ?? 'guest';
  const [coupon, setCoupon] = useState('');
  const cart = useQuery({
    queryKey: queryKeys.cart(scope),
    queryFn: ({ signal }) => getCart(signal),
    enabled: !session.isPending,
  });
  const related = useQuery({
    queryKey: queryKeys.catalog(homeSearch),
    queryFn: ({ signal }) => getCatalog(homeSearch, signal),
  });
  const quote = useQuery({
    queryKey: queryKeys.quote(scope, cart.data?.version),
    queryFn: ({ signal }) => getQuote(cart.data!.version, {}, signal),
    enabled: !!cart.data && cart.data.lines.length > 0,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (
      action:
        | { kind: 'update'; id: string; quantity: number }
        | { kind: 'remove'; id: string }
        | { kind: 'coupon'; code: string }
        | { kind: 'removeCoupon' },
    ) => {
      if (action.kind === 'update') return updateItem(action);
      if (action.kind === 'remove') return removeItem(action.id);
      if (action.kind === 'coupon') return applyCoupon(action.code);
      return removeCoupon();
    },
    onSuccess: async () => {
      setCoupon('');
      await client.invalidateQueries({ queryKey: queryKeys.cart(scope) });
    },
  });
  return (
    <div className="home-shell cart-shell mx-auto max-w-[1440px] px-16 pt-12 pb-16 max-[700px]:px-0 max-[700px]:pt-8 max-[700px]:pb-0">
      <SiteHeader />
      <main>
        {session.data &&
          sessionStorage.getItem(`kurio-cart-merge-warning:${session.data.user.id}`) && (
            <p role="alert">
              Não foi possível mesclar seu carrinho visitante. Ele foi preservado; saia da conta
              para revisá-lo e tente entrar novamente.
            </p>
          )}
        <div className="hidden max-[700px]:mx-6 max-[700px]:mb-4 max-[700px]:grid max-[700px]:grid-cols-[44px_1fr_44px] max-[700px]:items-center">
          <Link
            to="/"
            search={homeSearch}
            aria-label="Voltar ao catálogo"
            className="grid size-11 place-items-center rounded-pill bg-surface-raised text-foreground"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-center text-lg font-bold">Carrinho de NFTs</h1>
        </div>
        <nav
          aria-label="Trilha de navegação"
          className="mt-8 mb-3 text-sm font-bold max-[700px]:hidden"
        >
          <Link to="/" search={homeSearch}>
            Início
          </Link>{' '}
          /{' '}
          <Link to="/" search={homeSearch}>
            Mercado
          </Link>{' '}
          / Carrinho
        </nav>
        <h1 className="mb-6 text-2xl font-bold max-[700px]:hidden">Carrinho de NFTs</h1>
        {cart.isPending ? (
          <div
            className="grid gap-3 *:h-20 *:bg-surface-raised max-[700px]:mx-6"
            aria-label="Carregando carrinho"
          >
            <Skeleton />
            <Skeleton />
          </div>
        ) : cart.isError ? (
          <section role="alert" className="grid justify-items-start gap-4 py-12 max-[700px]:mx-6">
            <h2 className="text-xl font-bold">Não foi possível carregar o carrinho.</h2>
            <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
          </section>
        ) : cart.data.lines.length === 0 ? (
          <section className="grid justify-items-start gap-4 py-12 max-[700px]:mx-6">
            <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
            <p>Explore a coleção e escolha seu próximo NFT.</p>
            <Link to="/" search={homeSearch} className={buttonVariants()}>
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_332px] items-start gap-12 max-[900px]:grid-cols-1 max-[700px]:gap-6">
            <section
              aria-label="Itens do carrinho"
              className="max-[700px]:px-6 max-[360px]:mx-0 max-[360px]:px-3"
            >
              <div
                className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] gap-3 border-b border-primary-hover p-3 font-bold text-foreground max-[700px]:hidden"
                aria-hidden="true"
              >
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
              </div>
              <div className="grid gap-3 max-[700px]:gap-4">
                {cart.data.lines.map((line) => (
                  <article
                    className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] items-center gap-3 bg-surface p-2 text-sm max-[700px]:relative max-[700px]:block max-[700px]:min-h-[100px] max-[700px]:overflow-hidden max-[700px]:rounded-lg max-[700px]:p-0 max-[700px]:shadow-[0_6px_18px_color-mix(in_srgb,var(--bg-canvas)_45%,transparent)]"
                    key={line.id}
                  >
                    <Link
                      className="flex min-w-0 items-center gap-3 max-[700px]:items-start max-[700px]:pr-11"
                      to="/nft/$nftId"
                      params={{ nftId: line.nftId }}
                    >
                      <img
                        src={line.image}
                        alt=""
                        className="size-[72px] rounded-md object-cover max-[700px]:h-[100px] max-[700px]:w-[100px] max-[700px]:flex-none max-[700px]:rounded-l-lg max-[700px]:rounded-r-none max-[360px]:w-[82px]"
                      />
                      <span className="max-[700px]:min-w-0 max-[700px]:pt-3">
                        <strong className="block max-[700px]:text-sm max-[700px]:leading-(--line-height-label)">
                          {line.title}
                        </strong>
                        <small className="mt-1 block text-xs text-muted-foreground">
                          Edição: {line.editionLabel}
                        </small>
                      </span>
                    </Link>
                    <span className="text-muted-foreground max-[700px]:hidden">
                      {line.priceEth} ETH
                    </span>
                    <div
                      className="flex items-center gap-2 max-[700px]:absolute max-[700px]:right-2 max-[700px]:bottom-2 max-[700px]:gap-1"
                      aria-label={`Quantidade de ${line.title}`}
                    >
                      <Button
                        variant="outline"
                        aria-label={`Diminuir ${line.title}`}
                        disabled={mutation.isPending || line.quantity <= 1}
                        onClick={() =>
                          mutation.mutate({
                            kind: 'update',
                            id: line.id,
                            quantity: line.quantity - 1,
                          })
                        }
                        className={qtyButtonClass}
                      >
                        <Minus size={14} />
                      </Button>
                      <span>{line.quantity}</span>
                      <Button
                        variant="outline"
                        aria-label={`Aumentar ${line.title}`}
                        disabled={mutation.isPending || line.quantity >= line.available}
                        onClick={() =>
                          mutation.mutate({
                            kind: 'update',
                            id: line.id,
                            quantity: line.quantity + 1,
                          })
                        }
                        className={qtyButtonClass}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <strong className="text-primary max-[700px]:absolute max-[700px]:bottom-3 max-[700px]:left-[112px] max-[700px]:text-base max-[360px]:left-[94px]">
                      {line.lineTotalEth} ETH
                    </strong>
                    <Button
                      variant="outline"
                      className="min-h-8 min-w-8 border-0 p-1 max-[700px]:absolute max-[700px]:top-0 max-[700px]:right-0 max-[700px]:min-h-10 max-[700px]:min-w-10"
                      aria-label={`Remover ${line.title}`}
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ kind: 'remove', id: line.id })}
                    >
                      <Trash2 size={17} />
                    </Button>
                  </article>
                ))}
              </div>
              {mutation.isError && (
                <p role="alert" className="mt-4 text-destructive">
                  {message(mutation.error)}
                </p>
              )}
            </section>
            <aside className="grid gap-6 max-[900px]:max-w-lg max-[700px]:max-w-none max-[700px]:gap-4 max-[700px]:rounded-t-pill max-[700px]:bg-surface max-[700px]:p-6">
              <h2 className="text-lg font-bold max-[700px]:sr-only">Resumo da carteira</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate({ kind: 'coupon', code: coupon });
                }}
              >
                <label
                  htmlFor="coupon"
                  className="mb-2 block text-sm font-bold max-[700px]:sr-only"
                >
                  Código promocional
                </label>
                <div className="flex overflow-hidden rounded-md border border-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring max-[700px]:rounded-pill">
                  <Input
                    id="coupon"
                    placeholder="Digite o código promocional..."
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    className="min-w-0 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none max-[700px]:bg-transparent max-[700px]:pl-4"
                  />
                  <Button
                    type="submit"
                    disabled={mutation.isPending || !coupon.trim()}
                    className="min-h-0 rounded-md border-l-0 px-3 py-2 focus-visible:-outline-offset-2 max-[700px]:min-h-[50px] max-[700px]:rounded-pill max-[700px]:px-4 max-[700px]:py-2"
                  >
                    Aplicar
                  </Button>
                </div>
              </form>
              {cart.data.coupon && (
                <p className="text-xs text-muted-foreground">
                  Cupom {cart.data.coupon} aplicado{' '}
                  <button
                    onClick={() => mutation.mutate({ kind: 'removeCoupon' })}
                    disabled={mutation.isPending}
                    className="text-primary"
                  >
                    Remover
                  </button>
                </p>
              )}
              {quote.isPending ? (
                <p role="status">Calculando cotação...</p>
              ) : quote.isError ? (
                <div role="alert">
                  <p>Não foi possível atualizar a cotação.</p>
                  <Button
                    onClick={() => {
                      void cart.refetch();
                      void quote.refetch();
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                quote.data && (
                  <dl className="grid gap-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt>Subtotal</dt>
                      <dd className="text-right">{quote.data.subtotalEth} ETH</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Desconto do lançamento</dt>
                      <dd className="text-right">− {quote.data.discountEth} ETH</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Taxa de rede estimada</dt>
                      <dd className="text-right">{quote.data.networkFeeEth} ETH</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-primary-hover pt-4 text-lg font-bold">
                      <dt>Total</dt>
                      <dd className="text-right max-[700px]:text-primary">
                        {quote.data.totalEth} ETH
                      </dd>
                    </div>
                  </dl>
                )
              )}
              {quote.isSuccess && !quote.isFetching && !mutation.isPending ? (
                <Link to="/checkout" className={`${buttonVariants()} ${reviewCtaClass}`}>
                  Revisar pagamento
                </Link>
              ) : (
                <Button disabled className={reviewCtaClass}>
                  Revisar pagamento
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                A confirmação ficará disponível após a implementação do pagamento.
              </p>
              <Link className="text-primary" to="/" search={homeSearch}>
                Continuar explorando
              </Link>
            </aside>
          </div>
        )}
        <section className="mt-(--space-section) max-[700px]:mx-6 max-[360px]:mx-0 max-[360px]:px-3">
          <h2 className="mb-8 border-b border-primary-hover pb-3 font-bold text-primary">
            Colecionadores também viram
          </h2>
          {related.isPending ? (
            <p>Carregando NFTs...</p>
          ) : related.isError ? (
            <p>Não foi possível carregar outros NFTs.</p>
          ) : (
            <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-6 max-[700px]:grid-cols-[repeat(2,minmax(0,1fr))]">
              {related.data.items.slice(0, 5).map((item) => (
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
      </main>
      <SiteFooter />
    </div>
  );
}
