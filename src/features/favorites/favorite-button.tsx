import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { Nft } from '@/contracts/catalog'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSession } from '@/features/auth/session'
import { useChangeFavorite, useFavorites } from './hooks'

export function FavoriteButton({ nft, className }: { nft: Nft; className?: string }) {
  const session = useSession()
  if (session.isPending) return <Button variant="outline" className={className} disabled aria-label="Carregando favoritos"><Heart size={16} /></Button>
  if (!session.data) return <Link to="/login" search={{ redirect: `/nft/${encodeURIComponent(nft.id)}` }} className={`${buttonVariants({ variant: 'outline' })} ${className ?? ''}`} aria-label="Entre para favoritar"><Heart size={16} /> <span>Favoritar</span></Link>
  return <AuthenticatedButton nft={nft} userId={session.data.user.id} className={className} />
}
function AuthenticatedButton({ nft, userId, className }: { nft: Nft; userId: string; className?: string }) {
  const favorites = useFavorites(userId)
  const change = useChangeFavorite(userId)
  const selected = favorites.data?.items.some((item) => item.id === nft.id) ?? false
  return <><Button variant="outline" className={className} aria-pressed={selected} aria-label={selected ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} disabled={favorites.isPending || favorites.isError || change.isPending} onClick={() => change.mutate({ nft, add: !selected })}><Heart size={16} fill={selected ? 'currentColor' : 'none'} /> <span>{selected ? 'Favoritado' : 'Favoritar'}</span></Button>{(favorites.isError || change.isError) && <p role="alert">Não foi possível atualizar os favoritos. {favorites.isError && <button type="button" onClick={() => void favorites.refetch()}>Tentar novamente</button>}</p>}</>
}
