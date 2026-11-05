# Telas, rotas e permissões

As rotas abaixo são uma proposta de organização e podem ser ajustadas sem perder as funcionalidades obrigatórias.

| Rota proposta | Tela | Acesso | Responsabilidades |
|---|---|---|---|
| `/` | Início e catálogo | Público | Destaques, busca, filtros combináveis, ordenação, paginação e navegação |
| `/nft/$nftId` | Detalhe | Público | Galeria, informações, edição, quantidade, compra e favorito autenticado |
| `/cart` | Carrinho | Público | Alterar quantidades, remover, aplicar/remover cupom e conferir resumo |
| `/checkout` | Pagamento | Autenticado | Dados do colecionador, carteira, rede, revisão e envio |
| `/orders/$orderId` | Pedido | Dono do pedido | Acompanhar pendência/recusa e exibir recibo de confirmação |
| `/login` e `/register` | Conta | Público | Autenticação/cadastro, erros e retorno ao fluxo anterior |
| `/account` | Perfil | Autenticado | Dados, avatar e senha |
| `/account/wallets` | Carteiras | Autenticado | Cadastro e edição das carteiras principal e secundária |
| `*` | Não encontrada | Público | Tratamento de rota inexistente |

Favoritos e pedidos exigem autenticação, mesmo quando acionados a partir de uma tela pública. O usuário deve retornar ao contexto anterior após autenticação. Tela de pedido deve verificar também a propriedade do recurso. Perfil, carteiras e confirmação precisam funcionar em mobile mesmo sem frame próprio.

[← Voltar ao índice](../README.md)

## Visualização da navegação

```mermaid
flowchart LR
  Home[/] --> NFT[/nft/:id]
  NFT --> Cart[/cart]
  Cart --> Guard{Sessão ativa?}
  Guard -- não --> Login[/login]
  Login --> Checkout[/checkout]
  Guard -- sim --> Checkout
  Checkout --> Order[/orders/:id]
  Login --> Account[/account]
  Account --> Wallets[/account/wallets]
```

[Fluxos e sequências](jornadas-e-fluxos.md)
