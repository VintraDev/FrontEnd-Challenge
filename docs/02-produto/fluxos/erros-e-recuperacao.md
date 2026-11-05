# Fluxos de exceção e recuperação

## Árvore de decisões

```mermaid
flowchart TD
  X[Erro na operação] --> TYPE{Tipo de falha}
  TYPE -- 400/422 --> FORM[Preservar campos e indicar validação]
  TYPE -- 401 --> LOGIN[Encerrar scope privado + login]
  TYPE -- 403/404 --> ACCESS[Erro de acesso/recurso inexistente]
  TYPE -- 409 --> DOMAIN[Exibir conflito, atualizar estado da API]
  TYPE -- 5xx/offline --> RETRY[Retry controlado + feedback]
  TYPE -- Timeout no pedido --> BYKEY[Consultar pedido por chave idempotente]
  BYKEY --> PENDING[Manter estado sem criar novo pedido]
  RETRY --> SAFE{Operação idempotente?}
  SAFE -- Sim --> REQ[Retry com mesma identidade]
  SAFE -- Não --> VERIFY[Reconciliar antes de repetir]
```

## Matriz de resposta de UI

| Falha | UX esperada | Persistir contexto? | Repetir automaticamente? |
|---|---|---|---|
| Busca vazia | Estado vazio + limpar filtros | URL | Não |
| Erro GET transitório | Alert + retry explícito | Query params | Pode haver retry limitado |
| Token expirado | Login + retorno à rota | Itens do carrinho/intenção | Não em mutation sensível |
| Cupom inválido | Mensagem no campo | Carrinho | Não |
| Cotação stale | Atualizar preços, exigir confirmação | Carrinho | Não confirmar automaticamente |
| Timeout após criar pedido | Estado desconhecido + recuperar por key | `attemptId` | Jamais novo POST sem verificação |
| Socket desconectado | Indicador discreto + reconciliação REST | Pedido pendente | Reconectar com proteção de versões |

Regra de qualidade: erros devem ter UI e um comportamento real; `toast('sucesso')` sem mutação confirmada viola o desafio.

[Catálogo de erros](../../05-integracoes/catalogo-de-erros.md) · [Segurança](../../06-qualidade/seguranca-aplicacional.md).
