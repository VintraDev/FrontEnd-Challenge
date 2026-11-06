# Kurio — NFT Marketplace

Marketplace de NFTs desenvolvido para o Frontend Challenge da Jungle Gaming. A aplicação é uma demonstração local: API, sessões, carteiras, pagamento e tempo real são simulados com MSW e persistidos no navegador. Nenhum dado real, blockchain ou gateway de pagamento é utilizado.

## O que está implementado

- Catálogo com busca, filtros, ordenação, paginação e URL compartilhável.
- Detalhe do NFT com galeria, edição, estoque, quantidade e carrinho.
- Cadastro, login, logout, expiração de sessão e troca segura entre contas.
- Perfil, senha, avatar, e-mail, favoritos e carteiras por usuário.
- Carrinho de visitante e conta, merge no login, cupom e persistência após refresh.
- Cotação autoritativa com `decimal.js`, carteira/rede e revalidação.
- Pedido idempotente, recuperação após timeout, estados de pagamento e recibo imutável.
- Eventos `nft.updated` e `order.updated` por Socket.IO, validados e reconciliados por REST.
- Layout responsivo para as telas principais, componentes shadcn/ui, tokens e suporte básico a teclado/foco/movimento reduzido.

## Stack

React, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Zod, MSW, Socket.IO, Tailwind CSS, shadcn/ui, Vitest, Playwright e `decimal.js`.

## Executar localmente

```sh
npm ci
npm run dev
```

Para testar o build otimizado:

```sh
npm run build
npm run preview
```

Os mocks são ativados por padrão. `VITE_ENABLE_MOCKS=false` os desativa, mas a aplicação não possui backend alternativo.

## Credenciais de demonstração

| Usuário | E-mail | Senha |
|---|---|---|
| Ana | `ana@kurio.test` | `KurioDemo123!` |
| Bruno | `bruno@kurio.test` | `KurioDemo456!` |

As contas e senhas são somente fixtures locais. Sessões, perfis, favoritos, carrinhos, carteiras e pedidos ficam em IndexedDB/localStorage do navegador.

## Rotas

| Rota | Função |
|---|---|
| `/` | Catálogo e filtros |
| `/nft/:nftId` | Detalhe do NFT |
| `/cart` | Carrinho |
| `/checkout` | Revisão, cotação e confirmação da compra |
| `/orders/:orderId` | Recibo autorizado do pedido |
| `/favorites` | Favoritos da sessão |
| `/account` | Perfil |
| `/account/wallets` | Carteiras |
| `/login` e `/register` | Autenticação simulada |

## Cenários e reset

`POST /api/__test/reset` restaura fixtures e remove o estado persistido do mock. `POST /api/__test/scenario` ativa cenários de catálogo, favoritos, carteiras, pedidos e autenticação usados nos testes. Essas rotas existem apenas com MSW ativo.

Exemplos de cenários: catálogo vazio/lento/com erro, preço ou estoque alterado, falha de favorito/carteira, pedido recusado e timeout após commit.

## Qualidade verificada

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
SMOKE_PREVIEW=1 npx playwright test --workers=2 --reporter=html
npx playwright show-report
```

Na última validação, os comandos de qualidade, cobertura unitária (Vitest) e build passaram e o Playwright aprovou **88/88 testes** em Chromium, com preview e mocks ativos. Os relatórios locais são gerados em `coverage/` e `playwright-report/`.

Para executar a mesma sequência usada na integração contínua:

```sh
npm run quality:gate
```

## Limites conhecidos

- Não há deploy público, backend real, blockchain, pagamento ou OAuth real.
- Ainda não existem baselines visuais versionados nem auditoria Lighthouse.
- A recuperação automática após desconexão do Socket.IO ainda não tem prova E2E dedicada.
- A simulação não deve ser tratada como mecanismo de segurança de produção.

## Documentação

- [Arquitetura](ARCHITECTURE.md): fluxo de dados, sessão, checkout e Socket.IO.
- [Implementações entregues](docs/TASKS.md): registro curto do que foi concluído.
- [Fluxo de branches](docs/BRANCHING.md): integração obrigatória de `developer` para `main`.
- [Índice técnico detalhado](docs/README.md): requisitos e decisões de referência.
