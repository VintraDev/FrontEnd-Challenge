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

const navItemClass =
  'flex min-h-12 min-w-0 cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm text-primary hover:bg-surface-raised aria-[current=page]:border-l-4 aria-[current=page]:border-primary-hover aria-[current=page]:font-bold aria-[current=page]:text-foreground';

export function AccountSidebar({ active }: { active: 'profile' | 'wallets' | 'favorites' }) {
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  const renderMenu = (onNavigate?: () => void) => (
    <nav aria-label="Menu da conta" className="grid max-[700px]:grid-cols-[minmax(0,1fr)]">
      <Link
        to="/account"
        activeOptions={{ exact: true }}
        aria-current={active === 'profile' ? 'page' : undefined}
        onClick={onNavigate}
        className={navItemClass}
      >
        <UserRound size={20} /> Dados do perfil
      </Link>
      <Link
        to="/account/wallets"
        aria-current={active === 'wallets' ? 'page' : undefined}
        onClick={onNavigate}
        className={navItemClass}
      >
        <Wallet size={20} /> Carteiras
      </Link>
      <UnavailableAction title="Atividade" className={navItemClass}>
        <ShoppingBag size={20} /> Atividade
      </UnavailableAction>
      <Link
        to="/favorites"
        aria-current={active === 'favorites' ? 'page' : undefined}
        onClick={onNavigate}
        className={navItemClass}
      >
        <Heart size={20} /> Lista de interesse
      </Link>
      <UnavailableAction title="Ofertas" className={navItemClass}>
        <Tag size={20} /> Ofertas
      </UnavailableAction>
      <UnavailableAction title="Arquivos baixados" className={navItemClass}>
        <Download size={20} /> Arquivos baixados
      </UnavailableAction>
      <UnavailableAction title="Suporte" className={navItemClass}>
        <LifeBuoy size={20} /> Suporte
      </UnavailableAction>
      <button
        className="flex min-h-12 min-w-0 cursor-pointer items-center gap-3 border-t border-border px-4 py-2 text-left text-sm font-bold text-primary enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:text-muted-foreground"
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => onNavigate?.() })}
      >
        <LogOut size={20} /> {logout.isPending ? 'Saindo...' : 'Sair'}
      </button>
      {logout.isError && (
        <p role="alert" className="px-4 py-2 text-xs text-destructive">
          Não foi possível sair. Tente novamente.
        </p>
      )}
    </nav>
  );

  return (
    <>
      <div className="hidden max-[700px]:flex max-[700px]:items-center max-[700px]:justify-between max-[700px]:gap-3 max-[700px]:border-b max-[700px]:border-border max-[700px]:pb-4">
        <Link
          to="/"
          search={homeSearch}
          className="grid size-11 flex-none place-items-center rounded-pill bg-surface-raised text-foreground"
          aria-label="Voltar ao catálogo"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="grid min-w-0 flex-1">
          <span className="text-xs leading-(--line-height-label) text-muted-foreground">
            Meu perfil
          </span>
          <strong className="truncate text-base font-bold text-foreground">
            {activeTitles[active]}
          </strong>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-11 flex-none cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-primary"
              aria-label="Abrir menu da conta"
            >
              <Menu size={18} aria-hidden="true" />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="gap-0 overflow-y-auto border-border bg-surface p-0 text-foreground"
          >
            <SheetHeader className="border-b border-border px-4 pt-6 pb-4">
              <SheetTitle>Meu perfil</SheetTitle>
              <SheetDescription>Navegue pelas seções da sua conta.</SheetDescription>
            </SheetHeader>
            <div className="profile-sidebar profile-sidebar--sheet bg-surface py-2">
              {renderMenu(() => setOpen(false))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <aside className="profile-sidebar bg-surface py-4 max-[700px]:hidden">
        {/* Desktop sidebar */}
        <h2 className="px-4 pb-3 text-lg font-bold">Meu perfil</h2>
        {renderMenu()}
      </aside>
    </>
  );
}
