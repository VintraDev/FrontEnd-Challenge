# PR: Marketplace NFT — consolidação da entrega

## Resumo

Esta PR consolida a aplicação simulada do marketplace NFT, incluindo catálogo, autenticação, conta, carrinho, checkout, pedidos e eventos em tempo real.

## Implementações

- Catálogo com busca, filtros, ordenação, paginação e URL compartilhável.
- Detalhe de NFT com galeria, edições, estoque, quantidade e carrinho.
- Cadastro, login, logout, expiração de sessão e troca entre usuários.
- Perfil com e-mail, senha e avatar; favoritos persistentes por usuário.
- Carteiras com cadastro, edição, exclusão e conexão simulada.
- Carrinho de visitante e conta, merge no login, cupom e persistência após refresh.
- Cotação autoritativa com carteira/rede, revisão e cálculo decimal.
- Pedidos idempotentes, timeout após commit, estados de confirmação/recusa e recibo imutável.
- Eventos Socket.IO para atualização de NFT e pedido, com validação, versão, escopo e reconciliação REST.
- Layout responsivo e controles principais operáveis por teclado, foco visível e redução de movimento.

## Validação executada

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test:coverage`
- `npm run build`
- `SMOKE_PREVIEW=1 npx playwright test --workers=2 --reporter=html` — **88/88 testes aprovados**

## Limites conhecidos

- API, autenticação, carteiras, pagamento e Socket.IO são simulações locais com MSW.
- Não há deploy público, OAuth, blockchain ou gateway de pagamento real.
- Baselines visuais e auditoria Lighthouse ainda não foram produzidos.
- Reconexão automática do Socket.IO ainda não possui cenário E2E dedicado.
