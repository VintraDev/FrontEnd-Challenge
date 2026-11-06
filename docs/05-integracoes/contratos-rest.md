# Contratos REST propostos

Os endpoints a seguir são uma proposta da arquitetura, não uma API já existente. Validar entrada e saída nas fronteiras, inclusive erros. Base sugerida `/api`.

| Método e rota | Finalidade |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Cadastro e autenticação |
| `GET /auth/session`, `POST /auth/logout` | Sessão e encerramento |
| `GET /nfts`, `GET /nfts/:id` | Catálogo parametrizado e detalhe |
| `GET /favorites`, `POST /favorites`, `DELETE /favorites/:nftId` | Favoritos do usuário |
| `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId` | Carrinho |
| `POST /cart/merge` | Mesclar carrinho visitante e autenticado |
| `POST /quotes` | Validar itens, cupom e rede; devolver cotação autoritativa |
| `POST /orders` | Criar pedido com `Idempotency-Key` |
| `GET /orders/:orderId`, `GET /orders/by-key/:key` | Consultar pedido e recuperar tentativa após timeout |
| `GET /profile`, `PATCH /profile`, `POST /profile/password` | Perfil e senha |
| `GET /wallets`, `POST /wallets`, `PATCH /wallets/:walletId` | Carteiras |

Prever erros estruturados com código, mensagem e erros por campo quando houver, incluindo validação, sessão inválida, permissão negada, recurso inexistente, conflito e falha transitória. Uma convenção possível é `400/422`, `401`, `403`, `404`, `409` e `5xx`; o contrato final deve definir os códigos e as respostas de forma consistente.

### 8.1 Entidades essenciais

- **NFT:** ID, dados visuais, categoria, imagens, versão e edições com ID, estoque e preço decimal.
- **Linha do carrinho:** NFT, edição e quantidade inteira.
- **Cotação:** ID, versão, vencimento, itens, preços, disponibilidade, desconto, taxa e total em ETH.
- **Pedido:** ID, dono, status, chave de idempotência, data, referência de transação simulada e snapshot da cotação.
- **Evento:** ID estável, tipo, ID do recurso, versão e payload; eventos privados devem identificar o usuário autorizado.

[← Voltar ao índice](../README.md)
