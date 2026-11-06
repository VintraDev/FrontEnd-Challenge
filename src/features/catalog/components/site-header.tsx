import { Link, useLocation } from '@tanstack/react-router'
import { ShoppingBag, LogIn } from 'lucide-react'
import { HeaderSearch } from './header-search'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSession, useLogout } from '@/features/auth/session'

export function SiteHeader() {
  const session = useSession()
  const logout = useLogout()
  const isHome = useLocation({ select: (location) => location.pathname === '/' })
  return <header className="home-header"><Link to="/" search={{ q: '', categories: '', network: '', minPrice: '', maxPrice: '', sort: 'recent', page: 1 }} className="home-logo">KURIO</Link><nav aria-label="Navegação principal" className="home-nav"><a href="/#inicio" className={isHome ? 'active' : undefined}>Início</a><a href="/#catalogo" className={isHome ? undefined : 'active'}>Mercado</a><span>Criadores</span><span>Aprenda</span></nav><div className="home-actions"><HeaderSearch /><Link to="/cart" aria-label="Carrinho"><ShoppingBag size={22} /></Link>{session.data ? <><Link to="/account" className="session-name">{session.data.user.name}</Link><Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>Sair</Button>{logout.isError && <span role="alert">Não foi possível sair. Tente novamente.</span>}</> : <Link to="/login" search={{ redirect: undefined }} className={buttonVariants()}><LogIn size={17} /> Entrar</Link>}</div></header>
}
