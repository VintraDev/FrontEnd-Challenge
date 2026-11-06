import { useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { searchSchema } from '@/contracts/catalog'

export function HeaderSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const currentFilters = location.pathname === '/' ? searchSchema.parse(location.search) : searchSchema.parse({})

  return <Popover open={open} onOpenChange={(next) => { if (next) setQuery(currentFilters.q); setOpen(next) }}>
    <PopoverTrigger asChild><button type="button" className="header-search-trigger" aria-label="Abrir pesquisa"><Search size={21} aria-hidden="true" /></button></PopoverTrigger>
    <PopoverContent align="end" className="header-search-popover" aria-label="Pesquisa de NFTs">
      <form role="search" className="header-search-form" onSubmit={(event) => { event.preventDefault(); setOpen(false); void navigate({ to: '/', search: { ...currentFilters, q: query.trim(), page: 1 }, hash: 'catalogo' }) }}>
        <label htmlFor="header-search">Buscar NFTs</label>
        <div><Input id="header-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome do NFT" autoComplete="off" /><Button type="submit">Buscar</Button></div>
      </form>
    </PopoverContent>
  </Popover>
}
