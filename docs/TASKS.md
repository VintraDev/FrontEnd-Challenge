# TASKS — Implementações concluídas

> Registro conciso das funcionalidades entregues e validadas.

## Fundação

- [x] React, TypeScript, TanStack Router, TanStack Query, Axios, MSW, Socket.IO, Tailwind, shadcn/ui, Vitest e Playwright configurados.
- [x] Contratos Zod para API/erros, catálogo, sessão, perfil, favoritos, carteiras, carrinho, cotação, pedidos e eventos.
- [x] Query keys centralizadas, com escopo por usuário para dados privados.
- [x] Store MSW persistente com reset, cenários determinísticos e contas fictícias Ana e Bruno.

## Catálogo e detalhe

- [x] Busca, filtros por coleção/rede/faixa de preço, ordenação e paginação sincronizados na URL.
- [x] Header com busca funcional e carrossel navegável por teclado.
- [x] Página de detalhe com galeria, seleção de edição, estoque, quantidade, inclusão no carrinho e recuperação para NFT inexistente.
- [x] Layouts desktop e mobile para início, detalhe e carrinho.

## Sessão e conta

- [x] Cadastro, login, logout, expiração de sessão, retorno seguro à rota protegida e sincronização entre abas.
- [x] Limpeza de cache privado e encerramento do socket em logout, expiração ou troca de usuário.
- [x] Perfil com edição de e-mail, dados públicos, senha e avatar.
- [x] Favoritos persistentes por usuário, atualização otimista e rollback em erro.
- [x] Carteiras por usuário: cadastro, edição, exclusão, seleção de rede, conexão, recusa e desconexão simuladas.

## Carrinho, checkout e pedidos

- [x] Carrinhos separados para visitante e usuário, merge transacional no login/cadastro, cupom e persistência após refresh.
- [x] Cotação autoritativa com `decimal.js`, carteira/rede, versão e revalidação antes da confirmação.
- [x] Pedidos idempotentes por `Idempotency-Key`, recuperação após timeout, estados `pending`/`confirmed`/`declined`, débito após confirmação e recibo imutável autorizado por proprietário.

## Tempo real e acessibilidade

- [x] Eventos `nft.updated` e `order.updated` por `socket.io-client` com binding MSW, Zod, versão, `eventId` e escopo de usuário.
- [x] Reconciliação por invalidação e nova leitura REST das queries ativas.
- [x] Controles principais com labels, foco visível, suporte a teclado e `prefers-reduced-motion`.

## Evidência mais recente

- [x] `SMOKE_PREVIEW=1 npx playwright test --workers=2 --reporter=html`: 88/88 testes aprovados em Chromium; relatório local em `playwright-report/index.html`.
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:coverage` e `npm run build` aprovados.
