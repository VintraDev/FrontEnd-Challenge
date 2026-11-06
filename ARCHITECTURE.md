# Arquitetura

## Visão geral

```text
React UI
  ├─ TanStack Router: rotas, URL e proteção de páginas privadas
  ├─ TanStack Query: leitura, mutations e cache de respostas
  ├─ Axios: única fronteira REST usada pela interface
  └─ socket.io-client: notificações em tempo real
          │
          ▼
MSW handlers + Socket.IO binding
  └─ IndexedDB/localStorage: estado persistente da demonstração
```

O mock REST é a fonte de verdade. A interface não importa fixtures ou banco simulado. Eventos Socket.IO apenas notificam mudanças; após validá-los, o cliente invalida a query afetada e lê o REST novamente.

## Organização do código

| Pasta | Responsabilidade |
|---|---|
| `src/contracts` | Schemas Zod e tipos compartilhados de API e eventos |
| `src/features` | Páginas, APIs Axios e comportamento por domínio |
| `src/mocks` | Handlers MSW, fixtures, cenários e persistência simulada |
| `src/lib` | Cliente HTTP, query keys, erros e utilitários |
| `src/routes` | Definição das rotas TanStack Router |
| `src/components` | Componentes compartilhados e UI baseada em shadcn/ui |
| `tests` | Testes Playwright de fluxo, responsividade e contratos |

## Estado e persistência

- **URL:** busca, filtros, ordenação, página e navegação.
- **TanStack Query:** cache de respostas REST; keys privadas incluem o usuário atual.
- **React local:** somente estado visual transitório, como diálogos e seleção de galeria.
- **MSW + IndexedDB:** catálogo, sessão, perfil, favoritos, carteiras, carrinho, cotação e pedidos simulados.
- **localStorage:** token da sessão de demonstração.

O reset de teste restaura as fixtures por `POST /api/__test/reset`. Como a aplicação é uma demo local, não há garantia transacional entre todos os bancos IndexedDB.

## Sessão e isolamento

As rotas privadas exigem sessão. Cada recurso privado é consultado com o escopo do usuário autenticado. Logout, expiração e troca de conta cancelam queries privadas, removem cache do usuário anterior e desconectam o socket autenticado.

As contas de demonstração são Ana e Bruno. A autorização é aplicada pelos handlers MSW; isso comprova isolamento na demo, não segurança de produção.

## Compra

1. O carrinho é lido pelo REST e pode pertencer a visitante ou usuário.
2. O backend simulado calcula uma cotação com `decimal.js`, incluindo carrinho, cupom, carteira e rede.
3. O usuário aceita versão e hash da cotação atual.
4. A criação do pedido envia `Idempotency-Key` e o conteúdo canônico da tentativa.
5. A mesma chave e conteúdo retorna o mesmo pedido; conteúdo divergente retorna conflito.
6. Um pedido passa por `pending` e termina em `confirmed` ou `declined`.
7. Somente a confirmação debita as linhas da cotação e cria o recibo snapshot imutável.

Timeout após commit pode ser recuperado pela chave idempotente sem criar nova compra.

## Tempo real

`nft.updated` e `order.updated` trafegam por `socket.io-client` e `@mswjs/socket.io-binding`. Todo evento passa por Zod e é descartado se tiver `eventId` repetido, versão antiga ou escopo de usuário incorreto. O cliente então invalida as queries ativas de catálogo, detalhe, carrinho, cotação ou pedido e reconsulta o REST.

## Regras de implementação

- Valores ETH trafegam como strings decimais; cálculos usam `decimal.js` no mock.
- Componentes usam Axios/Query para dados, nunca fixtures diretamente.
- Mudanças em contratos públicos devem preservar compatibilidade ou introduzir adaptadores.
- Tokens visuais ficam em `src/styles/tokens.css`; componentes usam tokens semânticos.

## Verificação

Na última execução registrada, `typecheck`, lint, formatação e build passaram. Playwright aprovou 88/88 testes em Chromium com build de preview e MSW ativo. Baselines visuais, Lighthouse, deploy público e a prova E2E de reconexão automática continuam fora da evidência atual.
