# Matriz de rastreabilidade de requisitos

**Objetivo:** permitir que cada exigência do desafio apareça em três lugares: arquitetura, implementação e teste. A numeração `Rxx` é interna à documentação, não fornecida pela empresa.

| ID | Requisito do README | Onde projetar | Evidência mínima esperada |
|---|---|---|---|
| R01 | Stack obrigatória utilizada efetivamente | [Stack](stack.md), [Arquitetura](../ARCHITECTURE.md) | Importações/fluxos reais e build |
| R02 | Catálogo: URL, filtros, paginação | [Catálogo](../02-produto/funcionalidades/catalogo-e-detalhes.md) | E2E com refresh e histórico |
| R03 | Detalhe: acesso direto, inexistente, estoque | [Rotas](../02-produto/telas-e-rotas.md) | E2E de detalhe e 404 |
| R04 | Favoritos persistentes autenticados | [Sessão](../05-integracoes/autenticacao-e-sessao.md) | E2E com falha e rollback |
| R05 | Carrinho visitante + login, cupons e estoque | [Carrinho](../02-produto/funcionalidades/carrinho.md) | E2E de merge, refresh e conflito |
| R06 | ETH decimal, cotação da API | [ETH](../03-arquitetura/valores-em-eth.md) | Testes de precisão/total |
| R07 | Compra revalidada e idempotente | [Idempotência](../05-integracoes/idempotencia-e-recuperacao.md) | E2E clique repetido e timeout |
| R08 | Estados de pedido e recibo snapshot | [Máquinas de estado](../05-integracoes/maquinas-de-estado.md) | Recusa, confirmação, atualização posterior |
| R09 | Login, cadastro, expiração, isolamento | [Sessão](../05-integracoes/autenticacao-e-sessao.md) | E2E com dois usuários |
| R10 | APIs REST e tratamento de erros | [Contratos](../05-integracoes/especificacao-de-contratos.md) | Network inspector / E2E |
| R11 | MSW com cenários determinísticos | [Mocks](../05-integracoes/mocks-e-cenarios.md) | Reset e cenários reproduzíveis |
| R12 | Socket.IO real via MSW binding | [Tempo real](../05-integracoes/tempo-real.md) | E2E observando `socket.io-client` |
| R13 | A11y e shimmer responsivo | [UI](../04-design-system/acessibilidade-e-responsividade.md) | Teste teclado e skeleton |
| R14 | Playwright E2E + visual | [Testes](../06-qualidade/testes.md) | Suíte, baselines, relatório e traces |
| R15 | Lighthouse 3 execuções / 4 categorias | [Performance](../06-qualidade/lighthouse-e-performance.md) | Medianas, HTML/JSON, LCP/CLS/TBT |
| R16 | Deploy público autônomo | [Deploy](../08-entrega/deploy-e-validacao.md) | URL funcional, deep links e mocks |
| R17 | README + ARCHITECTURE documentados | [Entrega](../08-entrega/orientacoes-de-entrega.md) | Documentos atualizados ao código |

## Classificação de risco

**Eliminatórios explícitos:** ausência de uso real da stack, fluxos apenas visuais, compra confirmada sem retorno do mock, dados privados vazando entre usuários, eventos falsificados diretamente na UI e falta de E2E executáveis. São itens de **validação contínua**, não itens para deixar ao último dia.

[Índice principal](../README.md)
