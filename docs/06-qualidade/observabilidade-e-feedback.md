# Observabilidade, erros e comunicação de falhas

## Objetivo

Durante testes do MSW e Socket.IO, precisamos identificar o que aconteceu **sem expor dados sensíveis nem simular sucesso indevido**.

## Taxonomia de eventos internos (proposta)

| Evento de diagnóstico | Campos permitidos | Campos proibidos |
|---|---|---|
| `http.request.failed` | rota, código, duração, requestId | senha, cookie, token, dados completos |
| `session.changed` | motivo, `sessionEpoch` não secreto | bearer token |
| `socket.reconnected` | recurso e versão | payload privado da outra conta |
| `quote.revalidated` | quoteId fictício, motivo, status | endereço real de carteira |
| `order.attempt.recovered` | attemptId não sensível, status | corpo com informações pessoais |

## Modelo de resposta de erro

```json
{
  "error": {
    "code": "EDITION_UNAVAILABLE",
    "message": "Quantidade indisponível para a edição.",
    "requestId": "req-demo-001",
    "details": {"editionId": "ed-002"}
  }
}
```

Esse envelope é **proposto**. O cliente faz tratamento por `code`, não por texto da mensagem. `requestId` deve ser fictício e não carregar informação sensível.

## Estratégia de comunicação ao usuário

- Erro de formulário: junto ao campo; preservar preenchimento.
- Erro de rede transitório: banner acessível + botão de tentar novamente.
- Conflito de estoque/quote: informar mudança e exigir revisão.
- Falha desconhecida de pedido: estado de recuperação, nunca dizer “compra falhou” se pode ter sido criada.
- Logout/401: sessão encerrada com retorno seguro à intenção.

## Critério de qualidade

Nenhuma mudança de dado é considerada bem-sucedida apenas por disparar handler; só mostrar confirmação após estado aceito pelo mock REST, incluindo reconciliação em Socket.IO quando necessário.

[Erros](../05-integracoes/catalogo-de-erros.md) · [Fluxos de recuperação](../02-produto/fluxos/erros-e-recuperacao.md).
