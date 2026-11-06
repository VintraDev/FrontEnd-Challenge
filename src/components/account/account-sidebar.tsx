import { Link } from '@tanstack/react-router'
import { Download, Heart, LifeBuoy, LogOut, ShoppingBag, Tag, UserRound, Wallet } from 'lucide-react'
import { UnavailableAction } from '@/components/feedback/unavailable-action'
import { useLogout } from '@/features/auth/session'

export function AccountSidebar({ active }: { active: 'profile' | 'wallets' | 'favorites' }) {
  const logout = useLogout()
  return <aside className="profile-sidebar"><h2>Meu perfil</h2><nav aria-label="Menu da conta"><Link to="/account" activeOptions={{ exact: true }} aria-current={active === 'profile' ? 'page' : undefined}><UserRound size={20} /> Dados do perfil</Link><Link to="/account/wallets" aria-current={active === 'wallets' ? 'page' : undefined}><Wallet size={20} /> Carteiras</Link><UnavailableAction title="Atividade"><ShoppingBag size={20} /> Atividade</UnavailableAction><Link to="/favorites" aria-current={active === 'favorites' ? 'page' : undefined}><Heart size={20} /> Lista de interesse</Link><UnavailableAction title="Ofertas"><Tag size={20} /> Ofertas</UnavailableAction><UnavailableAction title="Arquivos baixados"><Download size={20} /> Arquivos baixados</UnavailableAction><UnavailableAction title="Suporte"><LifeBuoy size={20} /> Suporte</UnavailableAction><button className="profile-logout" type="button" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut size={20} /> {logout.isPending ? 'Saindo...' : 'Sair'}</button>{logout.isError && <p role="alert">Não foi possível sair. Tente novamente.</p>}</nav></aside>
}
