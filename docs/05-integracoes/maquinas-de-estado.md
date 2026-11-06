# Máquinas de estado — checkout, pedido, carteira e UI

Estados explícitos tornam o comportamento testável e impedem confirmações indevidas.

## Pedido

```mermaid
stateDiagram-v2
  [*] --> pending: POST /orders retorna pedido
  pending --> confirmed: mock REST/evento válido
  pending --> declined: mock REST/evento válido
  pending --> pending: polling/reconexão/refresh
  confirmed --> [*]
  declined --> [*]
  note right of confirmed: Estado terminal\nrecibo por snapshot
  note right of declined: Estado terminal\ncarrinho preservado
```

**Proibido:** `confirmed -> pending`, `declined -> confirmed`, “sucesso” sem resposta da simulação e novo pedido ao atualizar a página.

## Checkout

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> validating: Formulário preenchido
  validating --> quote_ready: Quote válida
  validating --> error: Validação / rede / estoque
  quote_ready --> revalidating: Confirmar
  revalidating --> quote_changed: Novo preço, estoque ou taxa
  quote_changed --> validating: Usuário aceita nova cotação
  revalidating --> submitting: Cotação ainda válida
  submitting --> pending: Pedido criado
  submitting --> uncertain: Timeout após tentativa
  uncertain --> pending: Busca por chave encontra pedido
  uncertain --> error: Estado não recuperável após política de tentativas
  pending --> confirmed: Estado confirmado via simulação
  pending --> declined: Estado recusado via simulação
  error --> validating: Corrigir e tentar novamente
```

## Carteira simulada

```mermaid
stateDiagram-v2
  [*] --> disconnected
  disconnected --> connecting: Solicitar conexão
  connecting --> connected: Simulação permite
  connecting --> rejected: Recusa
  rejected --> disconnected: Tentar novamente
  connected --> disconnected: Desconectar / sessão expira
```

## Estados de carregamento de feature

`idle -> loading -> success | empty | error`; ao fazer refetch em background, manter dados existentes e mostrar indicador não intrusivo. Cada estado deve ter texto/semântica/feedback acessível.

## Invariantes de implementação

- Eventos com `version` inferior/igual à observada não devem efetuar transição.
- Evento de `order.updated` com outro `userId` nunca altera pedido atual.
- O cliente pode navegar durante `pending`; estado deve ser recuperável.
- A recusa preserva carrinho; confirmação atualiza apenas quantidades efetivamente compradas.

[Idempotência](idempotencia-e-recuperacao.md) · [Índice](../README.md)
