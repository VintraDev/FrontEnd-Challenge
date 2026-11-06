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
import '@/features/catalog/home.css';
import './cart.css';
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
    <div className="home-shell cart-shell">
      <SiteHeader />
      <main>
        {session.data &&
          sessionStorage.getItem(`kurio-cart-merge-warning:${session.data.user.id}`) && (
            <p role="alert">
              Não foi possível mesclar seu carrinho visitante. Ele foi preservado; saia da conta
              para revisá-lo e tente entrar novamente.
            </p>
          )}
        <div className="cart-mobile-header">
          <Link to="/" search={homeSearch} aria-label="Voltar ao catálogo">
            <ArrowLeft size={20} />
          </Link>
          <h1>Carrinho de NFTs</h1>
        </div>
        <nav aria-label="Trilha de navegação" className="cart-breadcrumb">
          <Link to="/" search={homeSearch}>
            Início
          </Link>{' '}
          /{' '}
          <Link to="/" search={homeSearch}>
            Mercado
          </Link>{' '}
          / Carrinho
        </nav>
        <h1 className="cart-title">Carrinho de NFTs</h1>
        {cart.isPending ? (
          <div className="cart-loading" aria-label="Carregando carrinho">
            <Skeleton />
            <Skeleton />
          </div>
        ) : cart.isError ? (
          <section role="alert" className="cart-empty">
            <h2>Não foi possível carregar o carrinho.</h2>
            <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
          </section>
        ) : cart.data.lines.length === 0 ? (
          <section className="cart-empty">
            <h2>Seu carrinho está vazio</h2>
            <p>Explore a coleção e escolha seu próximo NFT.</p>
            <Link to="/" search={homeSearch} className={buttonVariants()}>
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section aria-label="Itens do carrinho">
              <div className="cart-table-head" aria-hidden="true">
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
              </div>
              <div className="cart-lines">
                {cart.data.lines.map((line) => (
                  <article className="cart-line" key={line.id}>
                    <Link className="cart-item" to="/nft/$nftId" params={{ nftId: line.nftId }}>
                      <img src={line.image} alt="" />
                      <span>
                        <strong>{line.title}</strong>
                        <small>Edição: {line.editionLabel}</small>
                      </span>
                    </Link>
                    <span className="cart-unit">{line.priceEth} ETH</span>
                    <div className="cart-quantity" aria-label={`Quantidade de ${line.title}`}>
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
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <strong className="cart-line-total">{line.lineTotalEth} ETH</strong>
                    <Button
                      variant="outline"
                      className="cart-remove"
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
                <p role="alert" className="cart-error">
                  {message(mutation.error)}
                </p>
              )}
            </section>
            <aside className="cart-summary">
              <h2>Resumo da carteira</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate({ kind: 'coupon', code: coupon });
                }}
              >
                <label htmlFor="coupon">Código promocional</label>
                <div className="cart-coupon">
                  <Input
                    id="coupon"
                    placeholder="Digite o código promocional..."
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                  />
                  <Button type="submit" disabled={mutation.isPending || !coupon.trim()}>
                    Aplicar
                  </Button>
                </div>
              </form>
              {cart.data.coupon && (
                <p className="coupon-applied">
                  Cupom {cart.data.coupon} aplicado{' '}
                  <button
                    onClick={() => mutation.mutate({ kind: 'removeCoupon' })}
                    disabled={mutation.isPending}
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
                  <dl className="cart-totals">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{quote.data.subtotalEth} ETH</dd>
                    </div>
                    <div>
                      <dt>Desconto do lançamento</dt>
                      <dd>− {quote.data.discountEth} ETH</dd>
                    </div>
                    <div>
                      <dt>Taxa de rede estimada</dt>
                      <dd>{quote.data.networkFeeEth} ETH</dd>
                    </div>
                    <div className="cart-grand-total">
                      <dt>Total</dt>
                      <dd>{quote.data.totalEth} ETH</dd>
                    </div>
                  </dl>
                )
              )}
              {quote.isSuccess && !quote.isFetching && !mutation.isPending ? (
                <Link to="/checkout" className={buttonVariants()}>
                  Revisar pagamento
                </Link>
              ) : (
                <Button disabled>Revisar pagamento</Button>
              )}
              <p className="cart-disclaimer">
                A confirmação ficará disponível após a implementação do pagamento.
              </p>
              <Link className="cart-continue" to="/" search={homeSearch}>
                Continuar explorando
              </Link>
            </aside>
          </div>
        )}
        <section className="cart-related">
          <h2>Colecionadores também viram</h2>
          {related.isPending ? (
            <p>Carregando NFTs...</p>
          ) : related.isError ? (
            <p>Não foi possível carregar outros NFTs.</p>
          ) : (
            <div className="cart-related-grid">
              {related.data.items.slice(0, 5).map((item) => (
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
      </main>
      <SiteFooter />
    </div>
  );
}
