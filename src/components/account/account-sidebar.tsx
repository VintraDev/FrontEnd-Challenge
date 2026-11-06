import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Download,
  Heart,
  LifeBuoy,
  LogOut,
  Menu,
  ShoppingBag,
  Tag,
  UserRound,
  Wallet,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UnavailableAction } from '@/components/feedback/unavailable-action';
import { useLogout } from '@/features/auth/session';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const activeTitles: Record<'profile' | 'wallets' | 'favorites', string> = {
  profile: 'Dados do perfil',
  wallets: 'Carteiras',
  favorites: 'Lista de interesse',
};

export function AccountSidebar({ active }: { active: 'profile' | 'wallets' | 'favorites' }) {
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  const renderMenu = (onNavigate?: () => void) => (
    <nav aria-label="Menu da conta">
      <Link
        to="/account"
        activeOptions={{ exact: true }}
        aria-current={active === 'profile' ? 'page' : undefined}
        onClick={onNavigate}
      >
        <UserRound size={20} /> Dados do perfil
      </Link>
      <Link
        to="/account/wallets"
        aria-current={active === 'wallets' ? 'page' : undefined}
        onClick={onNavigate}
      >
        <Wallet size={20} /> Carteiras
      </Link>
      <UnavailableAction title="Atividade">
        <ShoppingBag size={20} /> Atividade
      </UnavailableAction>
      <Link
        to="/favorites"
        aria-current={active === 'favorites' ? 'page' : undefined}
        onClick={onNavigate}
      >
        <Heart size={20} /> Lista de interesse
      </Link>
      <UnavailableAction title="Ofertas">
        <Tag size={20} /> Ofertas
      </UnavailableAction>
      <UnavailableAction title="Arquivos baixados">
        <Download size={20} /> Arquivos baixados
      </UnavailableAction>
      <UnavailableAction title="Suporte">
        <LifeBuoy size={20} /> Suporte
      </UnavailableAction>
      <button
        className="profile-logout"
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => onNavigate?.() })}
      >
        <LogOut size={20} /> {logout.isPending ? 'Saindo...' : 'Sair'}
      </button>
      {logout.isError && <p role="alert">Não foi possível sair. Tente novamente.</p>}
    </nav>
  );

  return (
    <>
      <div className="profile-mobile-bar">
        <Link
          to="/"
          search={homeSearch}
          className="profile-mobile-back"
          aria-label="Voltar ao catálogo"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="profile-mobile-heading">
          <span>Meu perfil</span>
          <strong>{activeTitles[active]}</strong>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="profile-mobile-menu-trigger"
              aria-label="Abrir menu da conta"
            >
              <Menu size={18} aria-hidden="true" />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="profile-mobile-sheet">
            <SheetHeader className="profile-mobile-sheet-header">
              <SheetTitle>Meu perfil</SheetTitle>
              <SheetDescription>Navegue pelas seções da sua conta.</SheetDescription>
            </SheetHeader>
            <div className="profile-sidebar profile-sidebar--sheet">
              {renderMenu(() => setOpen(false))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <aside className="profile-sidebar">
        {/* Desktop sidebar */}
        <h2>Meu perfil</h2>
        {renderMenu()}
      </aside>
    </>
  );
}
