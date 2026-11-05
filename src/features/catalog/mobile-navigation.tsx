import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, UserRound } from 'lucide-react'

export function MobileNavigation() {
  return <nav className="mobile-bottom-nav" aria-label="Navegação inferior">
    <svg className="mobile-bottom-shape" viewBox="0 0 414 95" preserveAspectRatio="none" aria-hidden="true"><path d="M282.85001 0c-13.76001 0-25.98001 8.2-31.83001 20.65-7.75999 16.52-24.56001 27.97-44.02 27.97-19.45999 0-36.26001-11.44-44.02-27.97-5.85001-12.45-18.08001-20.65-31.83001-20.65l-102.21999 0c-15.98 0-28.93 12.95-28.93 28.93l0 66.02 414 0 0-66.02c0-15.98-12.94998-28.93-28.92999-28.93l-102.22 0z" /></svg>
    <div className="mobile-bottom-items"><a href="#inicio" aria-label="Início" aria-current="page"><Home size={20} fill="currentColor" /></a><button type="button" disabled aria-label="Favoritos indisponíveis"><Heart size={20} fill="currentColor" /></button><a href="#catalogo" className="mobile-bottom-center" aria-label="Explorar NFTs"><ScanLine size={26} /></a><Link to="/cart" aria-label="Carrinho"><ShoppingCart size={20} fill="currentColor" /></Link><Link to="/login" aria-label="Entrar"><UserRound size={20} fill="currentColor" /></Link></div>
  </nav>
}
