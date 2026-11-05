# Jornadas de usuário e navegação

## Jornada principal: descoberta até a compra

```mermaid
flowchart TD
  Home[Início e catálogo] --> Search[Buscar / filtrar / ordenar]
  Search --> Detail[Detalhe do NFT]
  Detail --> Cart[Adicionar ao carrinho]
  Cart --> Checkout{Está autenticado?}
  Checkout -- Não --> Login[Login ou cadastro]
  Login --> Resume[Retomar carrinho e destino]
  Resume --> Wallet[Carteira + rede + dados]
  Checkout -- Sim --> Wallet
  Wallet --> Quote[Solicitar cotação]
  Quote --> Changed{Mudou preço, estoque ou taxa?}
  Changed -- Sim --> Review[Mostrar diferenças e pedir nova aceitação]
  Review --> Quote
  Changed -- Não --> Confirm[Enviar pedido com chave de idempotência]
  Confirm --> Pending[Pedido pendente]
  Pending --> Final{Status da API / evento}
  Final -- Confirmado --> Receipt[Recibo do snapshot]
  Final -- Recusado --> Declined[Erro e carrinho preservado]
  Final -- Ainda pendente --> Recover[Consultar após refresh ou reconexão]
  Recover --> Final
```

**Regra:** a página de sucesso não é um efeito visual do clique em “comprar”; exige confirmação retornada pelo mock.

## Jornada de catálogo com URL

```mermaid
sequenceDiagram
  actor User as Visitante
  participant R as TanStack Router
  participant Q as TanStack Query
  participant A as Axios
  participant M as MSW catálogo
  User->>R: /?q=art&category=...&page=2
  R->>R: Validar/normalizar busca
  R->>Q: queryKey com filtros normalizados
  Q->>A: GET /api/nfts?... (AbortSignal)
  A->>M: Request REST
  M-->>A: Paginação + itens + metadados
  A-->>Q: Payload tipado
  Q-->>User: Itens + estados visuais
  User->>R: Mudar categoria
  R->>R: Reiniciar page=1
  Note over R,Q: Back/forward/refresh restauram a URL
```

## Navegação por acesso

```mermaid
flowchart LR
  P[Público] --> H[Home]
  P --> D[Detalhe]
  P --> C[Carrinho]
  P --> L[Login / cadastro]
  A[Autenticado] --> F[Favoritos no detalhe]
  A --> CH[Checkout]
  A --> O[Pedido do próprio usuário]
  A --> PR[Perfil e carteiras]
  P -. acesso protegido .-> L
  L -. retorno ao contexto .-> CH
```

## Inventário de telas exigidas

Home, detalhe, carrinho, checkout, confirmação, login, cadastro, perfil, carteiras. A interface precisa contemplar desktop e mobile, inclusive telas sem frame mobile explícito. Páginas editoriais e outros links fora do escopo não devem fingir funcionalidades.

[Índice principal](../README.md)
