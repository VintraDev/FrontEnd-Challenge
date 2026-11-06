# Limites arquiteturais, dependências e responsabilidades

## Contexto / containers

```mermaid
flowchart TB
  USER[Usuário] --> UI[React UI + TanStack Router]
  UI --> DATA[TanStack Query / Mutations]
  UI --> SOCKET[socket.io-client]
  DATA --> AXIOS[Axios + REST]
  AXIOS --> MSW[MSW handlers HTTP]
  SOCKET --> MWS[MSW WebSocket + Socket.IO binding]
  MSW --> STORE[(Store e fixtures persistidos)]
  MWS --> STORE
  TEST[Playwright] --> UI
  AUDIT[Lighthouse] --> UI
  UI --> DESIGN[Tailwind / shadcn UI]
```

## Regras de dependência

- `routes` importam `features` e `components`; nunca repositório mock diretamente.
- `features` importam `contracts`, `lib`, `components`, hooks das próprias features; dependências cruzadas precisam interface pública.
- `lib/http` configura Axios e tratamento de erro; não contém fixtures.
- `mocks` implementa infraestrutura/test data; depende de `contracts`; não depende de código React.
- `realtime` traduz payload versionado em invalidação/reconciliação; não decide negócio de checkout sozinho.
- `tests` observam comportamento pela UI, REST via MSW e protocolo Socket.IO; não devem induzir resultado via setters de componente.

## Classificação de estado

| Estado | Dono | Fonte de verdade |
|---|---|---|
| Filtros/página/ordenar | Router | URL validada |
| Modal, aba, foco, seleção temporária | React local | Componente |
| NFTs, favoritos, carrinho, perfil, pedidos | TanStack Query | API simulada |
| Cotação e pedido | MSW/store | API, com snapshot/version |
| Evento realtime | Socket.IO | Notificação; REST reconcilia |
| Identidade da sessão | Auth feature / API | Sessão no store MSW |

## Direção de dependências

```mermaid
flowchart LR
  P[Pages] --> F[Features]
  P --> C[Shared UI]
  F --> S[Services / hooks]
  S --> T[Contracts]
  S --> H[Axios e Query]
  MOCK[MSW / DB] --> T
  TEST[Test harness] --> P
  TEST --> MOCK
```

**Antipadrões proibidos:** componente `import { fixtures } from 'mocks'`; `setTimeout` para simular `order.updated` na UI; múltiplas fontes de preço; mutation de pedido com retry sem idempotência.

[Mapa C4](mapa-c4.md) · [Estrutura de pastas](estrutura-de-pastas.md) · [Estado](modelo-de-estado.md).
