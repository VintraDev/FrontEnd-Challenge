import { queryKeys } from '@/lib/query-keys'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Search, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SiteHeader } from './components/site-header'
import { UnavailableAction } from '@/components/feedback/unavailable-action'
import { SiteFooter } from '@/components/layout/site-footer'
import { MobileNavigation } from './mobile-navigation'
import { Route } from '@/routes/index'
import { getCatalog } from './api'
import type { CatalogSearch } from '@/contracts/catalog'
import './home.css'

const categories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis', 'Generativa', 'Jogos', 'Assinaturas', 'Utilidade']
const networks = ['Ethereum', 'Polygon', 'Solana']
const stories = [
  ['Como funciona a propriedade de NFTs', 'Aprenda a colecionar, negociar e verificar ativos digitais.'],
  ['10 artistas digitais para acompanhar', 'Conheça criadores que moldam a cultura digital.'],
  ['Raridade, atributos e procedência', 'Entenda raridade, procedência, direitos autorais e utilidade.'],
  ['Como proteger sua carteira', 'Proteja sua carteira, seus ativos e sua identidade.'],
]
export function HomePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery({ queryKey: queryKeys.catalog(search), queryFn: ({ signal }) => getCatalog(search, signal) })
  const selected = search.categories.split(',').filter(Boolean)
  const [minPrice, setMinPrice] = useState(search.minPrice)
  const [maxPrice, setMaxPrice] = useState(search.maxPrice)
  useEffect(() => { setMinPrice(search.minPrice); setMaxPrice(search.maxPrice) }, [search.minPrice, search.maxPrice])
  const update = (patch: Partial<CatalogSearch>) => navigate({ search: { ...search, ...patch }, resetScroll: false })
  const filterContent = <div className="filters"><h2>Coleções</h2><fieldset><legend className="sr-only">Filtrar por coleção</legend>{categories.map((category) => <label key={category} className="filter-option"><Checkbox checked={selected.includes(category)} onCheckedChange={(checked) => update({ categories: (checked ? [...selected, category] : selected.filter((x) => x !== category)).join(','), page: 1 })} /><span>{category}</span></label>)}</fieldset><h2>Faixa de preço</h2><form className="price-filter" onSubmit={(event) => { event.preventDefault(); if ((!minPrice || /^\d+(\.\d+)?$/.test(minPrice)) && (!maxPrice || /^\d+(\.\d+)?$/.test(maxPrice))) update({ minPrice, maxPrice, page: 1 }) }}><label>Mínimo (ETH)<Input inputMode="decimal" pattern="[0-9]+([.][0-9]+)?" title="Use números e ponto decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0.00" /></label><label>Máximo (ETH)<Input inputMode="decimal" pattern="[0-9]+([.][0-9]+)?" title="Use números e ponto decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="12.30" /></label><Button type="submit">Aplicar</Button></form><h2>Rede</h2><fieldset><legend className="sr-only">Filtrar por rede</legend>{networks.map((network) => <label key={network} className="filter-option"><input type="radio" name="network" checked={search.network === network} onChange={() => update({ network, page: 1 })} /><span>{network}</span></label>)}</fieldset><Button variant="outline" onClick={() => { setMinPrice(''); setMaxPrice(''); update({ q: '', categories: '', network: '', minPrice: '', maxPrice: '', page: 1 }) }}>Limpar filtros</Button></div>
  return <div className="home-shell">
    <SiteHeader />
    <main id="inicio">
      <div className="mobile-search"><Search size={19} aria-hidden="true" /><Input aria-label="Explorar coleções" placeholder="Explorar coleções" value={search.q} onChange={(event) => update({ q: event.target.value, page: 1 })} /><Sheet><SheetTrigger asChild><Button aria-label="Abrir filtros" className="mobile-filter"><SlidersHorizontal size={21} /></Button></SheetTrigger><SheetContent className="mobile-filter-sheet"><SheetHeader><SheetTitle>Filtros</SheetTitle><SheetDescription>Refine os NFTs por coleção, preço e rede.</SheetDescription></SheetHeader>{filterContent}</SheetContent></Sheet></div>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">Bem-vindo à Kurio</p><h1 className="desktop-hero-title">SEJA DONO DO FUTURO<br /> DA ARTE DIGITAL</h1><h1 className="mobile-hero-title">SEJA DONO DA<br /> CULTURA DIGITAL</h1><p className="desktop-hero-copy">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</p><p className="mobile-hero-copy">Descubra NFTs selecionados de criadores do mundo todo.</p><a className="hero-link" href="#catalogo">EXPLORAR</a></div><img src="/assets/nfts/image-import-1.png" alt="Arte digital de um macaco com roupa verde" /></section>
      <section id="catalogo" className="catalog-layout" aria-label="Catálogo de NFTs"><aside className="catalog-sidebar">{filterContent}<div className="featured"><UnavailableAction title="NFT em destaque" className="card-overlay"><span className="sr-only">Saiba mais sobre o NFT em destaque</span></UnavailableAction><p>NFT EM DESTAQUE</p><strong>OFERTA LIMITADA</strong><img src="/assets/nfts/image-import.png" alt="Arte digital de colecionável" loading="lazy" /></div></aside>
      <div className="catalog-main"><div className="catalog-toolbar"><div><div className="mobile-catalog-tabs"><strong>Todos os NFTs</strong><span>Novos lançamentos</span><span>Em alta</span></div><h2 className="desktop-catalog-title">Todos os NFTs</h2><p className="catalog-count">{query.isSuccess ? `${query.data.total} resultados` : 'Explore a coleção'}</p></div><div className="catalog-controls"><div className="search-wrap"><Search size={16} /><Input id="busca" aria-label="Buscar NFTs" placeholder="Buscar NFTs" value={search.q} onChange={(event) => update({ q: event.target.value, page: 1 })} /></div><Select value={search.sort} onValueChange={(value) => update({ sort: value as CatalogSearch['sort'], page: 1 })}><SelectTrigger aria-label="Ordenar por"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Listados recentemente</SelectItem><SelectItem value="price-asc">Menor preço</SelectItem><SelectItem value="price-desc">Maior preço</SelectItem></SelectContent></Select></div></div>
      {query.isPending ? <div className="product-grid" aria-label="Carregando catálogo">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="product-skeleton" />)}</div> : query.isError ? <div role="alert" className="catalog-feedback"><p>Não foi possível carregar os NFTs.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div> : query.data.items.length === 0 ? <div className="catalog-feedback"><p>Nenhum NFT encontrado para estes filtros.</p><Button variant="outline" onClick={() => { setMinPrice(''); setMaxPrice(''); update({ q: '', categories: '', network: '', minPrice: '', maxPrice: '', page: 1 }) }}>Limpar filtros</Button></div> : <><div className="product-grid">{query.data.items.map((nft) => <Card key={nft.id} className="nft-card"><CardContent className="nft-content"><Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-card-link"><span className="nft-image"><span className="nft-image-clip"><img src={nft.image} alt={`Arte de ${nft.title}`} loading="lazy" /></span></span><h3>{nft.title}</h3><p>{nft.priceEth} ETH</p></Link></CardContent></Card>)}</div><nav className="pagination" aria-label="Paginação">{Array.from({ length: query.data.totalPages }, (_, i) => <Button key={i} variant={search.page === i + 1 ? 'default' : 'outline'} aria-current={search.page === i + 1 ? 'page' : undefined} onClick={() => update({ page: i + 1 })}>{i + 1}</Button>)}</nav></>}
      </div></section>
      <section className="promos" aria-label="Destaques"><article><UnavailableAction title="Lançamentos gênesis de edição limitada" className="card-overlay"><span className="sr-only">Saiba mais sobre lançamentos gênesis de edição limitada</span></UnavailableAction><img src="/assets/nfts/image-import-1.png" alt="" loading="lazy" /><div><h2>Lançamentos gênesis de edição limitada</h2><p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p></div></article><article><UnavailableAction title="Arte digital selecionada e muito mais" className="card-overlay"><span className="sr-only">Saiba mais sobre arte digital selecionada</span></UnavailableAction><img src="/assets/nfts/image-import-3.png" alt="" loading="lazy" /><div><h2>Arte digital selecionada e muito mais</h2><p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p></div></article></section>
      <section className="journal"><h2>Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p><div className="journal-grid">{stories.map(([title, description], i) => <Card key={title}><UnavailableAction title={title} className="card-overlay"><span className="sr-only">Saiba mais: {title}</span></UnavailableAction><img src={`/assets/nfts/${['image-import-1.png','image-import.png','image-import-3.png','image-import-2.png'][i]}`} alt="" loading="lazy" /><CardContent><h3>{title}</h3><p>{description}</p><span>Em breve <ArrowRight size={14} /></span></CardContent></Card>)}</div></section>
    </main><SiteFooter /><MobileNavigation />
  </div>
}
