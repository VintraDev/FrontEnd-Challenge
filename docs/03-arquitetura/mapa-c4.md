# Mapa C4 — Contexto, containers e limites

Os diagramas a seguir usam o **vocabulário C4**, simplificado em Mermaid. São **propostas** de organização, não uma descrição de serviços existentes da empresa.

## Nível 1: contexto

```mermaid
flowchart LR
  Collector([Colecionador]) -->|Navega, filtra, compra| SPA[Marketplace NFT]
  Reviewer([Avaliador técnico]) -->|Executa E2E e auditoria| SPA
  SPA -->|REST e Socket.IO| Mock[Serviços simulados no browser]
  Designer[Protótipo no Pencil via MCP] -. identidade visual .-> SPA
```

- **Colecionador** executa o fluxo de descoberta, conta, compra e acompanhamento.
- **Avaliador** executa testes, cenários, medições e navegação direta.
- **Simulação** substitui serviços reais de blockchain, carteira e pagamento; o produto continua acessível sem backend privado.

## Nível 2: containers

```mermaid
flowchart TB
  subgraph Browser[Navegador]
    subgraph Client[React SPA]
      ROUTER[TanStack Router]
      VIEW[Telas e componentes]
      QUERY[TanStack Query]
      AXIOS[Axios]
      SOCKET[socket.io-client]
    end
    subgraph Mocks[Simulação MSW]
      REST[Handlers HTTP]
      PROTO[MSW WebSocket + SocketIo]
      STORE[(Store persistente por identidade)]
      SCENE[Fixtures e cenários]
    end
  end
  ROUTER --> VIEW
  VIEW --> QUERY
  VIEW --> SOCKET
  QUERY --> AXIOS
  AXIOS -->|HTTP interceptado| REST
  SOCKET -->|protocolo Socket.IO| PROTO
  REST --> STORE
  PROTO --> STORE
  SCENE --> STORE
  PW[Playwright Chromium] --> Browser
  LH[Lighthouse] --> Browser
```

**Crítico:** o navegador e o MSW podem compartilhar o mesmo ambiente de execução, mas a **fronteira de comunicação** deve continuar sendo HTTP/WebSocket. Nunca importar `mocks/db` diretamente da UI. A persistência proposta deve resistir ao refresh e aceitar reset previsível.

## Nível 3: componentes (limite do frontend)

```mermaid
flowchart LR
  Routes[Routes] --> Layouts[Layouts / Pages]
  Layouts --> FeatureUI[Feature components]
  FeatureUI --> Hooks[Query + mutation hooks]
  Hooks --> Api[API SDK por feature]
  Api --> HTTP[Axios client]
  FeatureUI --> RT[Realtime subscriber]
  RT --> SOCKET[socket.io-client]
  FeatureUI --> Shared[UI shared / shadcn]
  Api --> Contracts[Zod schemas / TypeScript types]
  RT --> Contracts
```

## Onde ficam as regras?

| Regra | Local |
|---|---|
| Validação e contrato HTTP | `src/contracts/`, e verificação de fronteira em handlers/clients |
| Regra de total/cupom/estoque | `src/mocks/domain/` ou serviço de domínio do mock |
| Autenticação/isolamento | `src/mocks/domain/auth` e `src/features/auth` para consumo |
| Ordenação/filtros do catálogo | handler REST e URL/search schema |
| Apresentação visual | `src/features/*/components`, `src/components/ui` e `styles` |
| Estados efêmeros de dialog/form | componentes/hooks locais |
| Cache e invalidação | hooks `features` + `lib/query-keys.ts` |

[Próximo: pastas](estrutura-de-pastas.md) · [Índice](../README.md)
