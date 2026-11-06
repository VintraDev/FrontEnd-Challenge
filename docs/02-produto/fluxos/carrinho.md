# Fluxo detalhado — carrinho, cupom e merge

```mermaid
flowchart TD
  D[Detalhe: selecionar NFT + edição + quantidade] --> A[POST /api/cart/items]
  A --> STOCK{Disponibilidade suficiente?}
  STOCK -- Não --> ERR[409: informar quantidade válida]
  STOCK -- Sim --> CART[Carrinho persistido no mock]
  CART --> COUP[Aplicar/remover cupom]
  COUP --> QUOTE[API: cotação e totais]
  CART --> AUTH{Visitante faz login?}
  AUTH -- Sim --> MERGE[Merge transacional, por edição]
  MERGE --> CONFLICT{Estoque insuficiente?}
  CONFLICT -- Sim --> FEEDBACK[Exibir conflito sem sumir com itens]
  CONFLICT -- Não --> KEEP[Carrinho de conta persistido]
  CART --> RT[Socket: nft.updated]
  RT --> REQUOTE[Invalidar cotação, mostrar alteração]
```

## Regras de domínio

- Identidade de linha: `(nftId, editionId)` e `lineId` estável no carrinho.
- Persistência visitante **não** dá acesso a dados privados.
- Merge somente após autenticação confirmada; operação idempotente de merge ou flag transacional para não duplicar em refresh.
- `quantity` inteiro; estoque e preço verificados pela API; ETH string decimal.
- Cupom/total nunca calculados com regras secretas na UI.

## Aceite principal

- [ ] Adicionar, editar e remover linhas passa por Axios/MSW.
- [ ] Refresh conserva itens e cupom válido conforme política simulada.
- [ ] Login conserva itens visitantes, sem duplicar com duplo submit.
- [ ] Cupom inválido/expirado apresenta erro e não desconto.
- [ ] Evento de preço/estoque altera resumo e exige nova cotação.

[UC](../casos-de-uso.md) · [Contratos REST](../../05-integracoes/especificacao-de-contratos.md).
