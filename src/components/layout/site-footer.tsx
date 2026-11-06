import { Link } from '@tanstack/react-router';
import { Bell, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnavailableAction } from '@/components/feedback/unavailable-action';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};
const categories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'];
const profileLinks = ['Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'];
const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
];

const footerActionClass =
  'cursor-pointer text-left text-sm text-foreground hover:text-primary hover:no-underline max-[700px]:min-h-9';
const benefitSectionClass =
  'border-r border-primary-hover px-4 last:border-0 max-[700px]:border-0 max-[700px]:p-0';
const benefitIconClass =
  'mb-4 grid size-16 place-items-center rounded-full bg-primary-hover text-background';
const benefitHeadingClass = 'text-base font-bold text-foreground';
const benefitCopyClass = 'mt-3 text-xs leading-(--line-height-body)';
const linksSectionClass = 'flex flex-col gap-2 max-[700px]:min-w-0 max-[700px]:wrap-anywhere';

export function SiteFooter() {
  return (
    <footer className="site-footer mt-(--space-section) bg-transparent p-0 text-muted-foreground">
      <div className="footer-benefits grid grid-cols-[repeat(3,1fr)_1.3fr] bg-surface p-8 max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-8 max-[700px]:p-6">
        <section className={benefitSectionClass}>
          <span className={benefitIconClass}>
            <ShieldCheck />
          </span>
          <h2 className={benefitHeadingClass}>Segurança da carteira</h2>
          <p className={benefitCopyClass}>
            Proteja sua carteira e mantenha seus ativos verificados com confiança.
          </p>
        </section>
        <section className={benefitSectionClass}>
          <span className={benefitIconClass}>
            <Users />
          </span>
          <h2 className={benefitHeadingClass}>Criadores em destaque</h2>
          <p className={benefitCopyClass}>
            Conheça artistas, estúdios e comunidades que moldam a cultura digital na Kurio.
          </p>
        </section>
        <section className={benefitSectionClass}>
          <span className={benefitIconClass}>
            <Bell />
          </span>
          <h2 className={benefitHeadingClass}>Alertas de lançamentos</h2>
          <p className={benefitCopyClass}>
            Acompanhe calendários, novidades e listas de acesso a análises do mercado.
          </p>
        </section>
        <section className={benefitSectionClass}>
          <h2 className={benefitHeadingClass}>Antecipe-se ao próximo lançamento</h2>
          <div className="mt-4 flex">
            <Input aria-label="Seu e-mail" placeholder="Digite seu e-mail..." className="min-w-0" />
            <Button disabled className="min-h-0">
              Enviar
            </Button>
          </div>
          <p className={benefitCopyClass}>
            Novidades para colecionadores, histórias de criadores e novidades do mercado. Inscrições
            em breve.
          </p>
        </section>
      </div>
      <div className="grid grid-cols-4 items-center gap-4 bg-border p-8 text-sm text-foreground max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-4 max-[700px]:p-6">
        <strong className="text-foreground">KURIO</strong>
        <span>
          Feito para colecionadores,
          <br /> criadores e cultura
        </span>
        <UnavailableAction
          title="Contato"
          description="Os canais de contato ainda não estão disponíveis."
          className={footerActionClass}
        >
          contato@email.com
        </UnavailableAction>
        <UnavailableAction
          title="Contato"
          description="Os canais de contato ainda não estão disponíveis."
          className={footerActionClass}
        >
          +55 11 4002 8922
        </UnavailableAction>
      </div>
      <div className="grid grid-cols-4 gap-8 bg-surface p-8 max-[700px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[700px]:gap-x-6 max-[700px]:gap-y-8 max-[700px]:p-6">
        <section className={linksSectionClass}>
          <h2 className="mb-2 text-base font-bold text-foreground">Meu perfil</h2>
          <Link to="/account" className={footerActionClass}>
            Meu perfil
          </Link>
          {profileLinks.map((title) => (
            <UnavailableAction key={title} title={title} className={footerActionClass}>
              {title}
            </UnavailableAction>
          ))}
        </section>
        <section className={linksSectionClass}>
          <h2 className="mb-2 text-base font-bold text-foreground">Central de ajuda</h2>
          {helpLinks.map((title) => (
            <UnavailableAction key={title} title={title} className={footerActionClass}>
              {title}
            </UnavailableAction>
          ))}
        </section>
        <section className={linksSectionClass}>
          <h2 className="mb-2 text-base font-bold text-foreground">Coleções</h2>
          {categories.map((category) => (
            <Link
              key={category}
              to="/"
              search={{ ...homeSearch, categories: category }}
              hash="catalogo"
              className={footerActionClass}
            >
              {category}
            </Link>
          ))}
        </section>
        <section className={linksSectionClass}>
          <h2 className="mb-2 text-base font-bold text-foreground">Redes sociais</h2>
          <UnavailableAction title="Redes sociais" className={footerActionClass}>
            Em breve
          </UnavailableAction>
          <h2 className="mb-2 text-base font-bold text-foreground">Carteiras compatíveis</h2>
          <UnavailableAction
            title="Carteiras compatíveis"
            description="A conexão e o cadastro de carteiras ainda não estão disponíveis."
            className={footerActionClass}
          >
            Ethereum · Polygon · Solana
          </UnavailableAction>
        </section>
      </div>
      <p className="mt-3 p-4 text-center text-sm">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  );
}
