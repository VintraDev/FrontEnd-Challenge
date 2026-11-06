import { queryKeys } from '@/lib/query-keys';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Heart, Home, LogOut, ScanLine, ShoppingCart, UserRound } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSession, useLogout } from '@/features/auth/session';
import { getCart } from '@/features/cart/api';

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
    <nav className="mobile-bottom-nav" aria-label="Navegação inferior">
      <svg
        className="mobile-bottom-shape"
        viewBox="0 0 414 95"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M282.85001 0c-13.76001 0-25.98001 8.2-31.83001 20.65-7.75999 16.52-24.56001 27.97-44.02 27.97-19.45999 0-36.26001-11.44-44.02-27.97-5.85001-12.45-18.08001-20.65-31.83001-20.65l-102.21999 0c-15.98 0-28.93 12.95-28.93 28.93l0 66.02 414 0 0-66.02c0-15.98-12.94998-28.93-28.92999-28.93l-102.22 0z" />
      </svg>
      <div className="mobile-bottom-items">
        <a href="#inicio" aria-label="Início" aria-current={!exploring ? 'page' : undefined}>
          <Home size={20} fill="currentColor" />
        </a>
        <Link to="/favorites" aria-label="Favoritos">
          <Heart size={20} fill="currentColor" />
        </Link>
        <a
          href="#catalogo"
          className="mobile-bottom-center"
          aria-label="Explorar NFTs"
          aria-current={exploring ? 'location' : undefined}
        >
          <ScanLine size={26} />
        </a>
        <Link
          to="/cart"
          className="mobile-cart-link"
          aria-label={count ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'}
        >
          <ShoppingCart size={20} fill="currentColor" />
          {count > 0 && (
            <span className="mobile-cart-count" aria-hidden="true">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
        {session.data ? (
          <Popover open={accountOpen} onOpenChange={setAccountOpen}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Abrir menu da conta">
                <UserRound size={20} fill="currentColor" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" aria-label="Menu da conta">
              <strong>{session.data.user.name}</strong>
              <span>{session.data.user.email}</span>
              <Link to="/account">Meu perfil</Link>
              <button
                type="button"
                disabled={logout.isPending}
                onClick={() => logout.mutate(undefined, { onSuccess: () => setAccountOpen(false) })}
              >
                <LogOut size={18} />
                {logout.isPending ? 'Saindo...' : 'Sair da conta'}
              </button>
              {logout.isError && <p role="alert">Não foi possível sair. Tente novamente.</p>}
            </PopoverContent>
          </Popover>
        ) : (
          <Link to="/login" search={{ redirect: undefined }} aria-label="Entrar">
            <UserRound size={20} fill="currentColor" />
          </Link>
        )}
      </div>
    </nav>
  );
}
