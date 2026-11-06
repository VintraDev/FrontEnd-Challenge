import { Link } from '@tanstack/react-router';
import { Bell, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnavailableAction } from '@/components/feedback/unavailable-action';
import './site-footer.css';

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

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-benefits">
        <section>
          <span className="footer-icon">
            <ShieldCheck />
          </span>
          <h2>Segurança da carteira</h2>
          <p>Proteja sua carteira e mantenha seus ativos verificados com confiança.</p>
        </section>
        <section>
          <span className="footer-icon">
            <Users />
          </span>
          <h2>Criadores em destaque</h2>
          <p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na Kurio.</p>
        </section>
        <section>
          <span className="footer-icon">
            <Bell />
          </span>
          <h2>Alertas de lançamentos</h2>
          <p>Acompanhe calendários, novidades e listas de acesso a análises do mercado.</p>
        </section>
        <section>
          <h2>Antecipe-se ao próximo lançamento</h2>
          <div className="footer-newsletter">
            <Input aria-label="Seu e-mail" placeholder="Digite seu e-mail..." />
            <Button disabled>Enviar</Button>
          </div>
          <p>
            Novidades para colecionadores, histórias de criadores e novidades do mercado. Inscrições
            em breve.
          </p>
        </section>
      </div>
      <div className="footer-contact">
        <strong>KURIO</strong>
        <span>
          Feito para colecionadores,
          <br /> criadores e cultura
        </span>
        <UnavailableAction
          title="Contato"
          description="Os canais de contato ainda não estão disponíveis."
        >
          contato@email.com
        </UnavailableAction>
        <UnavailableAction
          title="Contato"
          description="Os canais de contato ainda não estão disponíveis."
        >
          +55 11 4002 8922
        </UnavailableAction>
      </div>
      <div className="footer-links">
        <section>
          <h2>Meu perfil</h2>
          <Link to="/account">Meu perfil</Link>
          {profileLinks.map((title) => (
            <UnavailableAction key={title} title={title}>
              {title}
            </UnavailableAction>
          ))}
        </section>
        <section>
          <h2>Central de ajuda</h2>
          {helpLinks.map((title) => (
            <UnavailableAction key={title} title={title}>
              {title}
            </UnavailableAction>
          ))}
        </section>
        <section>
          <h2>Coleções</h2>
          {categories.map((category) => (
            <Link
              key={category}
              to="/"
              search={{ ...homeSearch, categories: category }}
              hash="catalogo"
            >
              {category}
            </Link>
          ))}
        </section>
        <section>
          <h2>Redes sociais</h2>
          <UnavailableAction title="Redes sociais">Em breve</UnavailableAction>
          <h2>Carteiras compatíveis</h2>
          <UnavailableAction
            title="Carteiras compatíveis"
            description="A conexão e o cadastro de carteiras ainda não estão disponíveis."
          >
            Ethereum · Polygon · Solana
          </UnavailableAction>
        </section>
      </div>
      <p className="footer-copyright">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  );
}
