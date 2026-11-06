import { queryKeys } from '@/lib/query-keys';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Heart, Home, LogOut, ScanLine, ShoppingCart, UserRound } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSession, useLogout } from '@/features/auth/session';
import { getCart } from '@/features/cart/api';

const navItemClass =
  'pointer-events-auto flex h-[72px] items-center justify-center text-muted-foreground hover:text-primary active:scale-(--press-scale) aria-[current=page]:text-primary aria-[expanded=true]:text-primary disabled:cursor-not-allowed disabled:opacity-100 motion-reduce:active:transform-none';

export function MobileNavigation() {
  const session = useSession();
  const logout = useLogout();
  const cart = useQuery({
    queryKey: queryKeys.cart(session.data?.user.id ?? 'guest'),
    queryFn: ({ signal }) => getCart(signal),
    enabled: !session.isPending,
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);
  const count = cart.data?.lines.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const exploring = hash === '#catalogo';
  return (
    <nav
      className="mobile-bottom-nav pointer-events-none fixed bottom-0 left-0 z-40 hidden h-[calc(126px+env(safe-area-inset-bottom))] w-full max-[700px]:block"
      aria-label="Navegação inferior"
    >
      <svg
        className="absolute bottom-0 h-[calc(95px+env(safe-area-inset-bottom))] w-full fill-surface drop-shadow-[0_-10px_26px_color-mix(in_srgb,var(--bg-canvas)_45%,transparent)]"
        viewBox="0 0 414 95"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M282.85001 0c-13.76001 0-25.98001 8.2-31.83001 20.65-7.75999 16.52-24.56001 27.97-44.02 27.97-19.45999 0-36.26001-11.44-44.02-27.97-5.85001-12.45-18.08001-20.65-31.83001-20.65l-102.21999 0c-15.98 0-28.93 12.95-28.93 28.93l0 66.02 414 0 0-66.02c0-15.98-12.94998-28.93-28.92999-28.93l-102.22 0z" />
      </svg>
      <div className="absolute inset-x-0 top-0 bottom-[env(safe-area-inset-bottom)] grid grid-cols-5 items-end">
        <a
          href="#inicio"
          aria-label="Início"
          aria-current={!exploring ? 'page' : undefined}
          className={navItemClass}
        >
          <Home size={20} fill="currentColor" />
        </a>
        <Link to="/favorites" aria-label="Favoritos" className={navItemClass}>
          <Heart size={20} fill="currentColor" />
        </Link>
        <a
          href="#catalogo"
          className="pointer-events-auto flex size-[65px] items-center justify-center self-start justify-self-center rounded-full bg-linear-to-b from-primary-hover/40 to-primary-hover text-foreground hover:text-primary-foreground active:scale-(--press-scale) aria-[current=location]:shadow-[0_0_0_var(--focus-ring-width)_var(--focus-ring)] motion-reduce:active:transform-none"
          aria-label="Explorar NFTs"
          aria-current={exploring ? 'location' : undefined}
        >
          <ScanLine size={26} />
        </a>
        <Link
          to="/cart"
          className={`relative ${navItemClass}`}
          aria-label={count ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'}
        >
          <ShoppingCart size={20} fill="currentColor" />
          {count > 0 && (
            <span
              className="absolute top-2 left-[calc(50%+var(--space-1))] grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1 text-xs font-bold text-primary-foreground"
              aria-hidden="true"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
        {session.data ? (
          <Popover open={accountOpen} onOpenChange={setAccountOpen}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Abrir menu da conta" className={navItemClass}>
                <UserRound size={20} fill="currentColor" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              aria-label="Menu da conta"
              className="grid w-[min(280px,calc(100vw-var(--space-8)))] gap-2 rounded-md border border-border bg-surface-raised p-4 text-sm wrap-anywhere text-foreground"
            >
              <strong>{session.data.user.name}</strong>
              <span className="text-xs text-muted-foreground">{session.data.user.email}</span>
              <Link to="/account">Meu perfil</Link>
              <button
                type="button"
                disabled={logout.isPending}
                onClick={() => logout.mutate(undefined, { onSuccess: () => setAccountOpen(false) })}
                className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-left text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                <LogOut size={18} />
                {logout.isPending ? 'Saindo...' : 'Sair da conta'}
              </button>
              {logout.isError && (
                <p role="alert" className="text-xs text-destructive">
                  Não foi possível sair. Tente novamente.
                </p>
              )}
            </PopoverContent>
          </Popover>
        ) : (
          <Link
            to="/login"
            search={{ redirect: undefined }}
            aria-label="Entrar"
            className={navItemClass}
          >
            <UserRound size={20} fill="currentColor" />
          </Link>
        )}
      </div>
    </nav>
  );
}
