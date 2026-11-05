import { Link, useLocation } from '@tanstack/react-router'
import { Search, ShoppingBag, LogIn } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function SiteHeader() {
  const isHome = useLocation({ select: (location) => location.pathname === '/' })
  return <header className="home-header"><Link to="/" search={{ q: '', categories: '', network: '', minPrice: '', maxPrice: '', sort: 'recent', page: 1 }} className="home-logo">KURIO</Link><nav aria-label="Navegação principal" className="home-nav"><a href="/#inicio" className={isHome ? 'active' : undefined}>Início</a><a href="/#catalogo" className={isHome ? undefined : 'active'}>Mercado</a><span>Criadores</span><span>Aprenda</span></nav><div className="home-actions"><a href="/#busca" aria-label="Ir para busca"><Search size={21} /></a><Link to="/cart" aria-label="Carrinho"><ShoppingBag size={22} /></Link><Link to="/login" className={buttonVariants()}><LogIn size={17} /> Entrar</Link></div></header>
}
