import { Link } from '@tanstack/react-router'
import { Bell, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function HomeFooter() {
  return <footer className="home-footer">
    <div className="footer-benefits"><section><span className="footer-icon"><ShieldCheck /></span><h2>Segurança da carteira</h2><p>Proteja sua carteira e mantenha seus ativos verificados com confiança.</p></section><section><span className="footer-icon"><Users /></span><h2>Criadores em destaque</h2><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na Kurio.</p></section><section><span className="footer-icon"><Bell /></span><h2>Alertas de lançamentos</h2><p>Acompanhe calendários, novidades e listas de acesso a análises do mercado.</p></section><section><h2>Antecipe-se ao próximo lançamento</h2><div className="footer-newsletter"><Input aria-label="Seu e-mail" placeholder="Digite seu e-mail..." disabled /><Button disabled>Enviar</Button></div><p>Novidades para colecionadores, histórias de criadores e novidades do mercado. Inscrições em breve.</p></section></div>
    <div className="footer-contact"><strong>KURIO</strong><span>Feito para colecionadores,<br /> criadores e cultura</span><span>contato@email.com</span><span>+55 11 4002 8922</span></div>
    <div className="footer-links"><section><h2>Meu perfil</h2><Link to="/account">Meu perfil</Link><span>Minha coleção</span><span>Atividade</span><span>Estúdio do criador</span><span>Lista de interesse</span></section><section><h2>Central de ajuda</h2><span>Central de ajuda</span><span>Como comprar NFTs</span><span>Carteira e segurança</span><span>Política do mercado</span><span>Denunciar item</span></section><section><h2>Coleções</h2><a href="#catalogo">Arte digital</a><span>Fotografia</span><span>Música</span><span>Arte 3D</span><span>Utilidade</span></section><section><h2>Redes sociais</h2><p>Em breve</p><h2>Carteiras compatíveis</h2><p>Ethereum · Polygon · Solana</p></section></div>
    <p className="footer-copyright">© 2026 Kurio. Propriedade digital para todos.</p>
  </footer>
}
