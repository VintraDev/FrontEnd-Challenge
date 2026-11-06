# Contratos REST — especificação proposta

**Importante:** o README exige recursos e comportamentos, **não** impõe estes caminhos ou formatos exatos. O prefixo `/api`, nomes de endpoints e campos apresentados são decisões de projeto que devem ser implementadas de forma consistente entre Axios, MSW, fixtures e testes.

## 1. Padrão de transporte

- JSON em REST, base URL relativa `/api`.
- Identificadores sempre strings; datas ISO 8601; ETH **strings decimais**.
- Paginação 1-based; `pageSize` configurável e limitado, `total`, `totalPages` e `items` na resposta.
- Erros consistentes (`error.code`, `error.message`, `error.fieldErrors?` e `requestId?`).
- Resposta inválida deve falhar na borda (schema) e exibir recuperação, não ser tratada como sucesso.

```ts
export type Eth = string; // decimal exato: "0.004200000000000001"
export type ApiError = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
    requestId?: string;
  };
};
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Nft {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  version: number;
  editions: { id: string; label: string; priceEth: Eth; available: number }[];
}
```

## 2. Endpoints propostos

| Operação | Método e caminho | Autenticação | Efeitos |
|---|---|---|---|
| Login | `POST /api/auth/login` | Não | Emite sessão do usuário |
| Cadastro | `POST /api/auth/register` | Não | Cria usuário fictício, pode 409 |
| Sessão | `GET /api/auth/session` | Opcional | Retorna usuário ou estado anônimo |
| Logout | `POST /api/auth/logout` | Sim | Invalida token/sessão |
| Catálogo | `GET /api/nfts` | Não | Busca, filtros, sort, paginação |
| Detalhe | `GET /api/nfts/:id` | Não | 404 se inexistente |
| Favoritos | `GET /api/favorites` | Sim | Filtra por usuário |
| Adicionar favorito | `POST /api/favorites` | Sim | Idempotente por `(userId,nftId)` |
| Remover favorito | `DELETE /api/favorites/:nftId` | Sim | Atualiza cache privado |
| Carrinho | `GET /api/cart` | Visitante/conta | Identidade via sessão ou guestId |
| Adicionar linha | `POST /api/cart/items` | Visitante/conta | Estoque e inteiros |
| Alterar linha | `PATCH /api/cart/items/:lineId` | Visitante/conta | Checa propriedade/disponibilidade |
| Remover linha | `DELETE /api/cart/items/:lineId` | Visitante/conta | Atualiza versão |
| Mesclar carrinho | `POST /api/cart/merge` | Sim | Retorna conflitos resolvidos |
| Cotar | `POST /api/quotes` | Sim | Preço/estoque/cupom/rede |
| Criar pedido | `POST /api/orders` | Sim | Exige `Idempotency-Key` |
| Consultar pedido | `GET /api/orders/:id` | Dono | `pending/confirmed/declined` |
| Recuperar tentativa | `GET /api/orders/by-key/:key` | Dono | Consulta pedido já gerado |
| Perfil | `GET/PATCH /api/profile` | Sim | Persistência e validação |
| Senha | `POST /api/profile/password` | Sim | Sem armazenar em claro |
| Carteiras | `GET/POST /api/wallets` | Sim | Principal/secundária |
| Editar carteira | `PATCH /api/wallets/:id` | Dono | Mudança validada |
| Reset/situação | `/api/__test/*` | Só mock | Cenários determinísticos |

## 3. Catálogo: request e resposta

**Exemplo de URL:** `/api/nfts?q=gold&categories=art,collectibles&sort=price-asc&page=1&pageSize=12`.

```json
{
  "items": [
    {
      "id": "nft-001",
      "title": "Aurora",
      "description": "NFT fictício para teste",
      "category": "art",
      "images": ["/assets/nfts/aurora.webp"],
      "version": 3,
      "editions": [
        {"id":"ed-001", "label":"Standard", "priceEth":"0.125", "available":4}
      ]
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 27,
  "totalPages": 3
}
```

## 4. Carrinho: mutação

```http
POST /api/cart/items
Content-Type: application/json
```

```json
{"nftId":"nft-001","editionId":"ed-001","quantity":2}
```

**Resposta proposta:** carrinho completo com `id`, `version`, `lines[]` (quantidade), `guestId` ou `userId` e referências estáveis; o total monetário **não é fonte de verdade no cliente**. Quantidade 0/negativa/não inteira → `422`; estoque incompatível → `409 EDITION_UNAVAILABLE`.

## 5. Cotação e pedido

```http
POST /api/quotes
Authorization: Bearer <token-ficticio>
Content-Type: application/json
```

```json
{"cartVersion":7,"network":"ethereum","walletId":"wallet-001","couponCode":"WELCOME"}
```

```json
{
  "id":"quote-001",
  "version":"catalog-29:cart-7",
  "expiresAt":"2026-11-04T18:00:00Z",
  "network":"ethereum",
  "items":[{"nftId":"nft-001","editionId":"ed-001","quantity":2,"unitPriceEth":"0.125"}],
  "subtotalEth":"0.250",
  "discountEth":"0.025",
  "networkFeeEth":"0.003",
  "totalEth":"0.228"
}
```

O exemplo de data é **ilustrativo**, não uma política definida de validade. `POST /api/orders` recebe `quoteId` e contexto de confirmação com header `Idempotency-Key`. Persistir o hash canônico do payload e identidade para que repetição idêntica retorne **o mesmo pedido**. Se a chave for reutilizada com conteúdo diferente, responder `409 IDEMPOTENCY_CONFLICT`.

```http
POST /api/orders
Idempotency-Key: attempt-7f8b...
Content-Type: application/json
```

```json
{"quoteId":"quote-001","walletId":"wallet-001","network":"ethereum","acceptedQuoteVersion":"catalog-29:cart-7"}
```

```json
{
  "id":"order-001",
  "status":"pending",
  "userId":"user-001",
  "version":1,
  "quoteSnapshot":{"id":"quote-001","totalEth":"0.228","networkFeeEth":"0.003","items":[]},
  "transactionRef":null
}
```

**O snapshot no caso real** deve conter todos os itens, valores, desconto e rede, não a lista vazia meramente abreviada no exemplo. Após transição confirmada, o pedido devolve `status: "confirmed"` e `transactionRef` fictícia; a página só então mostra sucesso.

## 6. Matriz de respostas de erro

| HTTP | Código proposto | Significado |
|---|---|---|
| 400/422 | `VALIDATION_ERROR` | Payload/campos inválidos |
| 401 | `SESSION_EXPIRED` | Token ausente/inválido/expirado |
| 403 | `FORBIDDEN` | Pedido ou recurso privado de outro usuário |
| 404 | `NOT_FOUND` | NFT, carteira ou pedido inexistente |
| 409 | `ACCOUNT_EXISTS` | Cadastro duplicado |
| 409 | `EDITION_UNAVAILABLE` | Quantidade/edição incompatível |
| 409 | `QUOTE_STALE` | Preço, estoque ou taxa modificados |
| 409 | `IDEMPOTENCY_CONFLICT` | Mesmo key com payload diferente |
| 410/422 | `COUPON_EXPIRED` | Cupom inválido/expirado, convenção a fixar |
| 503 | `TRANSIENT_ERROR` | Falha simulada de servidor |
| timeout | `UNKNOWN_ORDER_RESULT` | Consultar pela chave antes de repetir |

## 7. Regras de versionamento e autorização

- Recurso `NFT` e `Order` incluem `version` monotônica.
- Qualquer endpoint privado consulta `userId` da sessão no mock backend; **não confia** em `userId` enviado pelo navegador.
- Em `GET /api/orders/by-key/:key`, validação ocorre contra o dono da chave.
- Cache deve distinguir identidade + parâmetros, e ser cancelado/limpo ao trocar de conta.
- Schemas de resposta devem refletir o contrato real e manter compatibilidade com fixtures e testes.

[Contratos resumidos](contratos-rest.md) · [Índice](../README.md)
