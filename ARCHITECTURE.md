# NFT Marketplace — Arquitetura Técnica

**Projeto:** Jungle Gaming — Frontend Challenge  
**Status:** Proposta de arquitetura; implementação e validações ainda não realizadas.  
**Fonte de requisitos:** https://github.com/junglegaming/frontend-challenge  
**Design:** Utilizar MCP para conexão com o pen.dev para visualização do design

## 1. Decisões arquiteturais

- **Build e interface:** Vite + React + TypeScript (strict). O roteamento é TanStack Router.
- **Roteamento:** TanStack Router baseado em arquivos, com parâmetros de URL tipados/validados por Zod e rotas protegidas.
- **Estado remoto:** TanStack Query para consultas, mutations, cache, invalidação, atualização otimista e rollback.
- **Rede REST:** Axios com um único cliente HTTP, contratos tipados e propagação de `AbortSignal` para cancelamento.
- **Mocks:** MSW no nível de rede; handlers REST compartilham um mesmo repositório simulado e fixtures determinísticas.
- **Persistência dos mocks:** IndexedDB (ou um adaptador persistente browser equivalente), com esquema versionado e reset explícito por cenário. Nenhuma regra de negócio ou fixture codificada nos componentes/hook de UI.
- **Tempo real:** `socket.io-client` na aplicação, MSW WebSocket com `@mswjs/socket.io-binding` no ambiente simulado. Usar apenas namespace padrão e mensagens texto; o binding não suporta namespaces customizados, acknowledgements ou payload binário. Forçar transporte WebSocket no cliente e testar handshake, envio, duplicata, reconexão e produção/deploy imediatamente.
- **Design system:** Tailwind CSS, tokens derivados do Figma, componentes shadcn/ui/Radix adaptados ao layout e acessibilidade.
- **Formulários:** React Hook Form + Zod, com erros do servidor adaptados aos campos.
- **Dinheiro:** `decimal.js`, mantendo valores ETH como strings decimais no transporte/persistência e inteiros para quantidades; nunca usar `number` para aritmética de valores ETH.
- **Testes:** Playwright E2E em Chromium desktop/mobile e snapshots visuais versionados; Vitest para regras puras se houver tempo.
- **Auditoria:** Lighthouse no build otimizado, mediana de 3 execuções por URL/viewport, relatórios HTML/JSON.
- **Publicação:** Vercel ou Netlify com reescrita de rotas para `index.html` e mocks no build de demonstração.

## 2. Estrutura de diretórios

```text
nft-marketplace/
├── public/
│   ├── mockServiceWorker.js
│   └── assets/                    # imagens e fontes locais, do Figma
├── src/
│   ├── app/
│   │   ├── providers.tsx          # QueryClientProvider + RouterProvider + UI
│   │   ├── query-client.ts
│   │   └── bootstrap.ts           # startWorker ANTES de renderizar
│   ├── routes/                    # geração de rotas TanStack Router
│   │   ├── __root.tsx
│   │   ├── index.tsx               # Home/catálogo
│   │   ├── nft.$nftId.tsx
│   │   ├── cart.tsx
│   │   ├── checkout.tsx
│   │   ├── orders.$orderId.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── account.index.tsx
│   │   └── account.wallets.tsx
│   ├── features/
│   │   ├── catalog/
│   │   │   ├── api/               # fetchNFTs, fetchNFT
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── utils/
│   │   ├── auth/                   # sessão, login, cadastro, guards
│   │   ├── favorites/
│   │   ├── cart/
│   │   ├── checkout/               # cotação, idempotência, pedidos, recibo
│   │   ├── profile/
│   │   ├── wallets/
│   │   └── realtime/               # socket e reconciliação REST
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (gerados/ajustados)
│   │   ├── layout/                 # header, footer, navegação
│   │   └── feedback/               # skeletons, empty/error states
│   ├── lib/
│   │   ├── http.ts                 # instância Axios
│   │   ├── query-keys.ts
│   │   ├── money.ts                # Decimal + formatação
│   │   ├── errors.ts
│   │   └── config.ts
│   ├── contracts/
│   │   ├── api.ts                  # schemas comuns, envelopes e erros
│   │   ├── catalog.ts
│   │   ├── checkout.ts
│   │   ├── account.ts
│   │   └── events.ts
│   ├── mocks/
│   │   ├── browser.ts             # setupWorker
│   │   ├── handlers/
│   │   │   ├── auth.ts
│   │   │   ├── catalog.ts
│   │   │   ├── cart.ts
│   │   │   ├── checkout.ts
│   │   │   ├── account.ts
│   │   │   └── scenarios.ts
│   │   ├── sockets/               # ws.link + SocketIo + bus de eventos
│   │   ├── db/                    # IndexedDB/repositório transacional
│   │   ├── fixtures/              # 2 usuários, NFTs, carteiras, cupons
│   │   └── scenarios/             # sucesso, timeout, conflito, reconexão...
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── routeTree.gen.ts           # gerado: não editar
├── tests/
│   ├── e2e/
│   │   ├── catalog.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── favorites.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   ├── realtime.spec.ts
│   │   ├── account.spec.ts
│   │   └── accessibility.spec.ts
│   ├── visual/                    # baselines 390 e 1440
│   └── helpers/                   # reset fixture e eventos determinísticos
├── audits/
│   ├── lighthouse.config.*
│   └── reports/
├── .env.example
├── playwright.config.ts
├── vite.config.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
└── ARCHITECTURE.md
```

**Regra de dependência:** `routes -> features -> lib/contracts`; `mocks -> contracts + mock db`. Componentes de UI **não importam** `mocks`, fixtures nem implementações de negócio. A única ligação app↔mock é a rede (HTTP e WebSocket) e a inicialização condicional do worker.

## 3. Rotas e navegação

| URL | Propósito | Acesso |
|---|---|---|
| `/` | destaques, busca, filtros, ordenação e paginação | público |
| `/nft/$nftId` | detalhe, edição, quantidade e favoritos | público; favorito autenticado |
| `/cart` | carrinho, cupom, cotação/resumo | visitante/autenticado |
| `/checkout` | dados, carteira, rede, revisão e confirmação | autenticado |
| `/orders/$orderId` | acompanhamento e recibo quando confirmado | dono do pedido |
| `/login?redirect=...` | autenticação com retorno à rota original | público |
| `/register?redirect=...` | cadastro | público |
| `/account` | perfil, avatar, alteração de senha | autenticado |
| `/account/wallets` | carteiras principal e secundária | autenticado |
| `*` | página 404 | público |

Os parâmetros de catálogo devem ficar na URL: `q`, `categories`, `editions`, `sort`, `page` e outros filtros presentes no layout. Validar com Zod. Atualizar filtro **reseta `page` para 1**. Histórico/refresh devem restaurar o mesmo estado. A `queryKey` deve conter os filtros normalizados.

## 4. Fronteiras de estado

| Estado | Origem da verdade | Cache/UI |
|---|---|---|
| NFTs, preços e estoque | mock DB via REST | TanStack Query; atualização/invalidação por evento |
| Favoritos | dados privados do usuário no mock DB | TanStack Query, atualização otimista com rollback |
| Carrinho do visitante | repositório de carrinho anônimo persistente via MSW | TanStack Query; união ao autenticar |
| Carrinho autenticado | mock DB particionado por `userId` | TanStack Query |
| Sessão/identidade | mock auth service | consulta `/session`; token de demonstração persistente |
| Carteiras e perfil | mock DB particionado por `userId` | TanStack Query |
| Cotação | endpoint `/quotes` (versão, expiração e hash do carrinho) | dados da UI; invalidar após mudanças |
| Pedido | mock DB com idempotência | mutations + polling/realtime enquanto pendente |
| Estado de formulário/modal | React Hook Form / `useState` | local, não TanStack Query |

**Ao logout/troca de usuário:** desconectar o socket, cancelar consultas em voo, limpar cache privado, invalidar sessão, descartar subscriptions e recriar keys privadas vinculadas ao usuário ativo. Não vazar itens, pedidos, favoritos ou carteiras entre usuários.

## 5. Contratos REST (proposta)

Todos os contratos são **definidos por nós**, visto que o README não fornece endpoints fechados. Utilizar base `/api` via Axios e handlers MSW correspondentes.

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/session
POST   /api/auth/logout
GET    /api/nfts?q=&categories=&editions=&sort=&page=&pageSize=
GET    /api/nfts/:id
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:nftId
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:itemId
DELETE /api/cart/items/:itemId
POST   /api/cart/merge
POST   /api/quotes              # {items, coupon, network}; valor autoritativo
POST   /api/orders              # header Idempotency-Key
GET    /api/orders/:orderId
GET    /api/orders/by-key/:key  # recuperar timeout pós-criação
GET    /api/profile
PATCH  /api/profile
POST   /api/profile/password
GET    /api/wallets
POST   /api/wallets
PATCH  /api/wallets/:walletId
POST   /api/__test/reset        # permitido somente em mock/testes
POST   /api/__test/scenario     # ativa cenário determinístico
POST   /api/__test/event        # altera mock DB e EMITE via socket, nunca direto na UI
```

**Schemas representativos:**

```ts
type Eth = string; // decimal exact, e.g. "0.000000000000000001"
type ApiError = { code: string; message: string; fieldErrors?: Record<string,string> };
type Nft = {
  id: string; slug: string; title: string; description: string;
  category: string; images: string[]; version: number;
  editions: Array<{ id: string; name: string; available: number; priceEth: Eth }>;
};
type CartLine = { nftId: string; editionId: string; quantity: number };
type Quote = {
  id: string; version: string; expiresAt: string;
  subtotalEth: Eth; discountEth: Eth; networkFeeEth: Eth; totalEth: Eth;
  items: Array<CartLine & { unitPriceEth: Eth; available: number }>;
};
type Order = {
  id: string; status: 'pending' | 'confirmed' | 'declined';
  idempotencyKey: string; userId: string; quoteSnapshot: Quote;
  transactionRef: string | null; createdAt: string;
};
type NftUpdated = { eventId: string; type: 'nft.updated'; resourceId: string; version: number; payload: Nft };
type OrderUpdated = { eventId: string; type: 'order.updated'; resourceId: string; version: number; userId: string; status: Order['status'] };
```

Validar payloads de entrada e saída nos pontos de fronteira; não confiar em cast `as Type` sem verificação quando o dado vem da API.

## 6. Checkout e idempotência (fluxo crítico)

1. Usuário autenticado entra em `/checkout`; recuperar carrinho e carteiras por REST.
2. Solicitar `POST /quotes`, com totais calculados **no servidor simulado**, usando Decimal. Guardar `quote.id`, versão e expiração.
3. Na revisão, revalidar preço, estoque, cupom e taxas. Se mudou, mostrar diferenças e exigir nova confirmação do usuário.
4. Gerar uma `Idempotency-Key` **uma única vez por tentativa de compra** e persisti-la até o resultado definitivo. Desabilitar ações duplicadas, mas não depender apenas do botão desabilitado.
5. `POST /orders` faz transação atômica no mock DB: compara o hash canônico do payload; para chave repetida com payload igual devolve o **mesmo pedido**; payload diferente devolve `409`.
6. Se ocorrer timeout **após persistir** o pedido, consultar `/orders/by-key/:key` em vez de criar outra compra.
7. Enquanto `pending`, acompanhar via `order.updated` e reconsultar REST após reconexão/refresh.
8. Confirmar somente com status `confirmed` retornado pelo backend simulado. Preservar carrinho em falhas/recusa. Em sucesso, remover somente unidades efetivamente compradas.
9. Recibo é **snapshot imutável** (preço, taxa, desconto, itens e rede) e não deriva do catálogo atual.

Estados de pedido `confirmed` e `declined` são terminais na simulação.

## 7. Tempo real e reconciliação

```text
MSW handlers e banco simulado (mesma fonte de verdade)
  ├── REST: leitura/mutação de NFT, carrinho, quote, order
  └── WebSocket: @mswjs/socket.io-binding
          └── socket.io-client (React)
                    └── realtime event manager
                         ├── descarta evento com versão <= versão conhecida
                         ├── verifica eventId e userId para dados privados
                         ├── invalida ou atualiza Query Cache
                         └── na reconexão: refetch REST dos recursos ativos
```

- `nft.updated`: atualizar catálogo/detalhe e sinalizar carrinho desatualizado; cancelar quote antiga.
- `order.updated`: atualizar pedido do usuário apenas se identidade/versão corretas; status terminal não regride.
- Ao reconectar, REST prevalece como fonte de verdade. Limpar listeners no unmount/logout/troca de conta.
- **Spike obrigatório no início:** comprovar localmente e no deploy que o binding Socket.IO permite handshake, emissão de ambos os eventos e reconexão com `socket.io-client` (`transports: ['websocket']`). Não deixar esse risco para o último dia.

A documentação do binding descreve limitações: namespace padrão e eventos textuais apenas; sem acknowledgements, namespaces customizados ou anexos binários. Caso necessário, adaptar o contrato para permanecer nessas limitações, documentando-as.

## 8. Mock store e cenários reproduzíveis

Fixture inicial: 2 usuários fictícios, pelo menos 20–30 NFTs com categorias/edições/estoques variados, duas carteiras por usuário, cupons válidos/inválidos/expirados e pedidos com estados variados.

- Cenários parametrizados: padrão/sucesso; vazio; lentidão/latência fora de ordem; 400/401/403/404/409/500; offline/timeout; conta duplicada; estoque/preço alterado; cupom expirado; pagamento recusado; timeout após criação; evento velho/duplicado; desconexão e reconexão.
- `POST /api/__test/reset` restaura fixtures e relógio lógico do cenário; o helper Playwright chama o endpoint antes de cada teste.
- O **mock store** tem persistência entre refreshs, mas o reset limpa integralmente o cenário; eventos passam pelo mesmo repositório, não por setters de componentes.
- Para autenticação, use credenciais inteiramente fictícias. A senha não é armazenada em texto claro. Tokens usados em `localStorage` são aceitáveis apenas como mecanismo de demonstração documentado, não como modelo de produção.

## 9. Qualidade e UX

- Componentes UI com estados `loading`, `empty`, `error`, `success`, refresh em background.
- Skeletons com shimmer dimensionado e suporte a `prefers-reduced-motion`.
- Formulários semânticos, labels e erro vinculado ao input, foco visível, trap/retorno de foco em diálogo, mensagens de estado via `aria-live`.
- Layout verificado em 390 / 768 / 1440 px, sem overflow lateral indevido.
- SVGs, imagens e fontes locais quando disponíveis no Figma; lazy-load das imagens fora da dobra, dimensão reservada para reduzir CLS.
- Visuais de fallback (404, indisponível, pending, declined, etc.) seguem tokens do Figma.

## 10. Testes e auditoria

**Playwright E2E, Chromium 390 e 1440:**
1. Catálogo: busca/filtros/ordem/paginação/histórico.
2. Detalhe direto/404/edição esgotada.
3. Cadastro, login, expiração, logout e troca de conta.
4. Favoritos otimistas com rollback.
5. Carrinho e persistência + merge de visitante.
6. Checkout com pedido confirmado e recibo imutável.
7. Pedido recusado, cliques repetidos e timeout após criação.
8. Edição de perfil/senha/avatar/carteiras e validação.
9. `nft.updated` com revalidação de cotação.
10. Eventos duplicados/velhos + reconexão + pedido pendente.
11. Teclado/foco/erros de formulário.
12. Skeletons, resposta lenta, retry e falhas HTTP.

Visual regression: home, detalhe, carrinho, checkout; snapshots com baseline versionada e dados/viewport/relógio fixos. Relatório HTML e traces de falha entregues.

Lighthouse: home e detalhe, mobile + desktop; 3 execuções por combinação, mediana de Performance >=90, A11y >=95, Best Practices >=95, SEO >=90; registrar LCP, CLS, TBT, versões e ambiente. Documentar scores abaixo da meta sem manipular cenário para favorecer a auditoria.

## 11. Critérios eliminatórios — checklist de aceitação

- [ ] Todas as bibliotecas obrigatórias efetivamente usadas.
- [ ] Rotas, autenticação, catálogo, detalhe, carrinho, checkout, confirmação, perfil e carteiras funcionam.
- [ ] Compra só confirma após resposta `confirmed` do mock, com idempotência.
- [ ] Nenhum dado privado entre contas no cache/store/subscriptions.
- [ ] Eventos realmente passam pelo cliente `socket.io-client` e `@mswjs/socket.io-binding`, não por callbacks diretos.
- [ ] Playwright E2E executável com mocks, isolamento e visual regression.
- [ ] Aplicação pública com refresh/deeplinks e mocks/tempo real funcionando.
- [ ] README + ARCHITECTURE.md, scripts, lockfile, assets e relatórios.

## 12. Ordem sugerida de trabalho (prazo de 48h)

**Primeiro:** validar os dois riscos principais — worker MSW e handshake `socket.io-client`/binding, inclusive em preview de produção; gerar shell de rotas e tokens Figma.

**Depois:** contratos, fixtures, store e rotas de catálogo/detalhe + visual; login/carrinho/checkout básico com mutações realmente conectadas.

**Em seguida:** idempotência, reconexão, isolamento, cenários de falha, conta/carteiras e estados faltantes.

**Por fim:** Playwright E2E + visual, Lighthouse, deploy, links, README e documentação de desvios.

Faça deploy preliminar ainda no primeiro dia para validar `history fallback`, worker MSW e Socket.IO antes de investir em todas as telas.

## 13. Padrões de engenharia

- TypeScript strict, sem `any` como atalho.
- ESLint + formatação consistente.
- Componentes pequenos e com responsabilidade única; features agrupam API, componentes, schemas e hooks.
- Não duplicar dados remotos em `useState`; derivar do Query Cache.
- Toda mutation deve indicar comportamento de loading, sucesso, erro, refetch/invalidação.
- Fail-fast nos contratos; erros com shape consistente; nenhum fluxo fora de escopo simula sucesso.
- Não registrar tokens/senhas em logs.
- Cada entrega de agente deve informar arquivos alterados, critérios cobertos, testes executados e riscos restantes.

## 14. Scripts planejados

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

`typecheck` deve apontar ao `tsconfig` de aplicação correto (por exemplo `tsc -p tsconfig.app.json --noEmit`) se o projeto Vite gerado usar referências de projeto. Adicionar scripts específicos do Lighthouse quando a configuração estiver implementada. Comandos listados são metas para implementar, **não executados**.

## 15. Decisões que dependem de validação

- Conferir os frames/assets/fontes do Figma para nomear os componentes de página e design tokens.
- Testar a versão publicada de `@mswjs/socket.io-binding` e a intercepção real do cliente Socket.IO no browser; se necessário, consultar documentação e ajustar configuração sem contornar o requisito de sockets.
- Confirmar se os canais da empresa permitem uso de agentes de IA e documentar a assistência usada quando solicitado.
- Não declarar a arquitetura pronta em produção até testes E2E, build e deploy passarem de verdade.

## 16. Registro do milestone inicial — 04/11/2026

A fundação inicial e os resultados verificados estão descritos no `README.md`. O binding publicado 0.2.0 usa `toSocketIo` com MSW 2, e o handler WebSocket usa `/` porque o MSW remove o prefixo Socket.IO na correspondência. O teste passou em desenvolvimento e preview para handshake, eventos de diagnóstico e nova conexão explícita. A reconexão automática após falha, eventos antigos/duplicados e a validação em deploy continuam pendentes; a prova não implementa reconciliação nem fluxos de negócio.
