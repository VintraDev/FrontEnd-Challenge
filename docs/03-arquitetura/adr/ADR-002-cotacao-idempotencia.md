# ADR-002 — Autoridade da cotação e idempotência

- **Status:** proposta / validar contratos e testes.
- **Problema:** preços e estoque podem mudar entre carrinho e compra, e timeout pode esconder pedido já criado.
- **Decisão:** cotação na API simulada com `quoteId`, versão e dados snapshot; compra com `Idempotency-Key` por tentativa e hash canônico do payload; GET por chave para recuperação.
- **Não fazer:** criar pedido confirmado ao clicar; confiar em total calculado em UI; novo POST após timeout sem consulta.
- **Consequências:** operações de domínio precisam ser atômicas; store guarda chave → pedido, dono, hash.
- **Validação:** Playwright dup-click, timeout pós-commit, stale quote e snapshot após mudança de preço.

[Checkout](../../02-produto/fluxos/checkout.md) · [Idempotência](../../05-integracoes/idempotencia-e-recuperacao.md).
