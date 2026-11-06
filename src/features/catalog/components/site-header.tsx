import { Link, useLocation } from '@tanstack/react-router';
import { ShoppingBag, LogIn } from 'lucide-react';
import { HeaderSearch } from './header-search';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSession, useLogout } from '@/features/auth/session';

export function SiteHeader() {
  const session = useSession();
  const logout = useLogout();
  const isHome = useLocation({ select: (location) => location.pathname === '/' });
  return (
    <header className="home-header flex min-h-16 items-center justify-between gap-6 border-b border-primary-hover max-[700px]:hidden">
      <Link
        to="/"
        search={{
          q: '',
          categories: '',
          network: '',
          minPrice: '',
          maxPrice: '',
          sort: 'recent',
          page: 1,
        }}
        className="font-bold tracking-[0.1em] text-foreground hover:text-primary"
      >
        KURIO
      </Link>
      <nav
        aria-label="Navegação principal"
        className="flex items-center gap-8 max-[1000px]:gap-4 max-[700px]:hidden"
      >
        <a
          href="/#inicio"
          className={`no-underline hover:text-primary ${isHome ? 'font-bold text-primary' : 'text-foreground'}`}
        >
          Início
        </a>
        <a
          href="/#catalogo"
          className={`no-underline hover:text-primary ${!isHome ? 'font-bold text-primary' : 'text-foreground'}`}
        >
          Mercado
        </a>
        <span className="text-muted-foreground">Criadores</span>
        <span className="text-muted-foreground">Aprenda</span>
      </nav>
      <div className="flex items-center gap-8 max-[700px]:gap-4">
        <HeaderSearch />
        <Link to="/cart" aria-label="Carrinho" className="text-foreground hover:text-primary">
          <ShoppingBag size={22} />
        </Link>
        {session.data ? (
          <>
            <Link to="/account" className="session-name text-foreground hover:text-primary">
              {session.data.user.name}
            </Link>
            <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Sair
            </Button>
            {logout.isError && <span role="alert">Não foi possível sair. Tente novamente.</span>}
          </>
        ) : (
          <Link to="/login" search={{ redirect: undefined }} className={buttonVariants()}>
            <LogIn size={17} /> Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
