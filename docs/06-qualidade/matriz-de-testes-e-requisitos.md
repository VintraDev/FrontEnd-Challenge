# Matriz de rastreabilidade RF → testes e evidências

> Todos os casos iniciam `Pendente`: documentação não equivale a implementação. Suites E2E seguem a numeração de cenários do README oficial. Critérios de performance/visual/documentação contam com suas próprias evidências.

## Suites mapeadas

| Suite | Escopo | Evidência esperada |
|---|---|---|
| **E2E-01** | Busca, filtros e histórico | relatório Playwright, screenshot/trace se falha |
| **E2E-02** | Detalhe, edição e 404 | relatório Playwright, screenshot/trace se falha |
| **E2E-03** | Conta, sessão e troca de usuário | relatório Playwright, screenshot/trace se falha |
| **E2E-08** | Perfil, avatar, senha e carteiras | relatório Playwright, screenshot/trace se falha |
| **E2E-04** | Favoritos e rollback | relatório Playwright, screenshot/trace se falha |
| **E2E-05** | Carrinho/cupom/merge | relatório Playwright, screenshot/trace se falha |
| **E2E-06** | Checkout e cotação | relatório Playwright, screenshot/trace se falha |
| **E2E-07** | Idempotência, recusa, timeout e recibo | relatório Playwright, screenshot/trace se falha |
| **E2E-09** | Preço via Socket.IO | relatório Playwright, screenshot/trace se falha |
| **E2E-10** | Eventos, reconexão, cenários e reset | relatório Playwright, screenshot/trace se falha |
| **E2E-11** | Acessibilidade e formulários | relatório Playwright, screenshot/trace se falha |
| **E2E-12** | QA, visual, performance e deploy | relatório Playwright, screenshot/trace se falha |
| **VISUAL-01…04** | Home/detalhe/carrinho/checkout | baselines versionadas + diffs |
| **LIGHTHOUSE-01…04** | Home/detalhe × mobile/desktop | HTML/JSON, mediana de 3 |
| **SMOKE-DEPLOY** | Refresh de rotas, MSW, socket | URL pública e execução manual registrada |
| **DOC-REVIEW** | README e operação | checklist com evidência |

## Mapeamento de todos os requisitos

| RF | Área | Caso(s) | Aceite observável | Status |
|---|---|---|---|---|
| RF-001 | Catálogo e descoberta | E2E-01 | Dado o cenário padrão, a página inicial exibe destaques e dados obtidos via Axios/MSW. | Pendente |
| RF-002 | Catálogo e descoberta | E2E-01 | Após pesquisar, a URL contém o termo e a API recebe a busca aplicada. | Pendente |
| RF-003 | Catálogo e descoberta | E2E-01 | Dois ou mais filtros coexistem e afetam o resultado sem sobrescrever os anteriores. | Pendente |
| RF-004 | Catálogo e descoberta | E2E-01 | A opção de ordenação altera a URL, a requisição e a ordem de exibição. | Pendente |
| RF-005 | Catálogo e descoberta | E2E-01 | Navegação de página respeita o total da API e os limites válidos. | Pendente |
| RF-006 | Catálogo e descoberta | E2E-01 | Refresh, back e forward preservam busca, filtros, ordenação e página. | Pendente |
| RF-007 | Catálogo e descoberta | E2E-01 | Ao aplicar ou remover um filtro, a página atual retorna a 1. | Pendente |
| RF-008 | Catálogo e descoberta | E2E-01 | Loading/skeleton, vazio, falha e retry aparecem sem resultados fantasmas. | Pendente |
| RF-009 | Catálogo e descoberta | E2E-02 | Uma URL de NFT válida abre detalhe; identificador desconhecido mostra recurso inexistente. | Pendente |
| RF-010 | Catálogo e descoberta | E2E-02 | Galeria e edições refletem preço, quantidade máxima e status retornados pela API. | Pendente |
| RF-011 | Catálogo e descoberta | E2E-02 | Edição indisponível não pode ser comprada; quantidade excedente é impedida. | Pendente |
| RF-012 | Identidade e conta | E2E-03 | Campos validados; criação bem-sucedida persiste após refresh; e-mail duplicado retorna conflito. | Pendente |
| RF-013 | Identidade e conta | E2E-03 | Credenciais válidas iniciam sessão; inválidas mostram erro sem revelar detalhes sensíveis. | Pendente |
| RF-014 | Identidade e conta | E2E-03 | Sessão válida é restaurada por API simulada e usuário inválido retorna a estado anônimo. | Pendente |
| RF-015 | Identidade e conta | E2E-03 | Após expiração ou logout, operações privadas deixam de ser autorizadas. | Pendente |
| RF-016 | Identidade e conta | E2E-03 | Acesso privado redireciona para login e retorna ao destino após autenticação. | Pendente |
| RF-017 | Identidade e conta | E2E-03 | Troca A→B não expõe perfil, favoritos, carteiras, pedidos ou eventos de A. | Pendente |
| RF-018 | Identidade e conta | E2E-08 | Edição validada é salva via API e permanece após refresh. | Pendente |
| RF-019 | Identidade e conta | E2E-08 | Erros de validação e da API são exibidos; dados confirmados persistem. | Pendente |
| RF-020 | Identidade e conta | E2E-08 | Cadastro e edição validada de carteiras com escopo da sessão, persistência e regras de principal. | Pendente |
| RF-021 | Identidade e conta | E2E-08 | Cada decisão aparece na UI e bloqueia a ação quando conexão exigida está indisponível. | Pendente |
| RF-022 | Identidade e conta | E2E-08 | Pedido de outra conta nunca retorna conteúdo privado nem pelo acesso direto. | Pendente |
| RF-023 | Favoritos e carrinho | E2E-04 | Favorito persiste por identidade e ao menos uma mutation usa atualização otimista com rollback. | Pendente |
| RF-024 | Favoritos e carrinho | E2E-05 | Adição respeita edição, disponibilidade e quantidade inteira positiva. | Pendente |
| RF-025 | Favoritos e carrinho | E2E-05 | Resumo exibe quantidade atualizada e remoção persistente após refresh. | Pendente |
| RF-026 | Favoritos e carrinho | E2E-05 | Visitante retorna após refresh com seu carrinho conservado. | Pendente |
| RF-027 | Favoritos e carrinho | E2E-05 | Itens são transferidos uma vez para a conta, com resolução documentada de conflitos. | Pendente |
| RF-028 | Favoritos e carrinho | E2E-05 | Descontos seguem resposta de cotação; código inválido/expirado apresenta erro explícito. | Pendente |
| RF-029 | Favoritos e carrinho | E2E-05 | Subtotal, desconto, taxa e total usam strings ETH decimais e respeitam a API. | Pendente |
| RF-030 | Favoritos e carrinho | E2E-05 | Evento de NFT altera dados visíveis e sinaliza necessidade de revalidação. | Pendente |
| RF-031 | Checkout e pedidos | E2E-06 | Usuário anônimo precisa autenticar-se e o carrinho permanece disponível. | Pendente |
| RF-032 | Checkout e pedidos | E2E-06 | Campos obrigatórios e erros são associados aos inputs sem permitir avanço inválido. | Pendente |
| RF-033 | Checkout e pedidos | E2E-06 | Checkout utiliza carteiras cadastradas e estado da conexão simulada. | Pendente |
| RF-034 | Checkout e pedidos | E2E-06 | Requisição recalcula preço, taxa, desconto e estoque antes da confirmação. | Pendente |
| RF-035 | Checkout e pedidos | E2E-06 | Quando preço, estoque, cupom ou taxa mudam, total anterior não pode ser confirmado. | Pendente |
| RF-036 | Checkout e pedidos | E2E-07 | Clique repetido ou retry conserva mesma chave para a mesma tentativa. | Pendente |
| RF-037 | Checkout e pedidos | E2E-07 | Ao desconhecer resultado, consulta por chave identifica o mesmo pedido sem duplicar. | Pendente |
| RF-038 | Checkout e pedidos | E2E-07 | Recibo de sucesso é mostrado apenas para pedido confirmado, nunca para pendente/recusado. | Pendente |
| RF-039 | Checkout e pedidos | E2E-07/E2E-10 | Pedido pendente volta ao estado correto após reconsulta REST e eventos. | Pendente |
| RF-040 | Checkout e pedidos | E2E-07/E2E-10 | Snapshot do pedido não muda quando os NFTs do catálogo mudam posteriormente. | Pendente |
| RF-041 | Checkout e pedidos | E2E-07 | Falhas preservam itens; sucesso retira somente quantidade comprada. | Pendente |
| RF-042 | Checkout e pedidos | E2E-07 | Referência e link de exploração fictícios são identificados como simulados. | Pendente |
| RF-043 | Tempo real e recuperação | E2E-09 | Atualização altera preço/estoque nas consultas ativas sem mutação direta na UI. | Pendente |
| RF-044 | Tempo real e recuperação | E2E-10 | Pedido em andamento sincroniza status pelo evento e confirma por consulta válida. | Pendente |
| RF-045 | Tempo real e recuperação | E2E-10 | Versão igual/menor não regride dados; o mesmo evento não reaplica efeitos. | Pendente |
| RF-046 | Tempo real e recuperação | E2E-10 | Após voltar à rede, consulta REST corrige estado local antes de permitir decisão crítica. | Pendente |
| RF-047 | Tempo real e recuperação | E2E-10 | Não há propagação de eventos de conta anterior nem listeners duplicados. | Pendente |
| RF-048 | Tempo real e recuperação | E2E-10 | Latência, timeout, offline, 4xx/5xx e respostas fora de ordem são reproduzíveis via MSW. | Pendente |
| RF-049 | Tempo real e recuperação | E2E-10 | Reset restaura integralmente um cenário conhecido sem vazamento entre testes. | Pendente |
| RF-050 | Interface, testes e operação | E2E-11 | Home, detalhe, carrinho, pagamento, confirmação, login, cadastro, perfil e carteiras existem. | Pendente |
| RF-051 | Interface, testes e operação | E2E-11 | Telas e fluxos operam em 390, 768 e 1440 px sem overflow indevido. | Pendente |
| RF-052 | Interface, testes e operação | E2E-12 | Catálogo, detalhe e resumo do carrinho preservam geometria; reduced motion respeitado. | Pendente |
| RF-053 | Interface, testes e operação | E2E-11 | Loading, confirmação, erro e evento de tempo real são compreensíveis sem cor isolada. | Pendente |
| RF-054 | Interface, testes e operação | E2E-01…12 | Playwright exercita 12 cenários do desafio, em Chromium mobile e desktop. | Pendente |
| RF-055 | Interface, testes e operação | VISUAL-01…04 | Baselines reproduzíveis para início, detalhe, carrinho e checkout versionadas. | Pendente |
| RF-056 | Interface, testes e operação | LIGHTHOUSE-01…04 | Três execuções por página/perfil com mediana e LCP, CLS e TBT registrados. | Pendente |
| RF-057 | Interface, testes e operação | SMOKE-DEPLOY | Build publicado abre rotas diretamente, refresh e mocks operam sem backend privado. | Pendente |
| RF-058 | Interface, testes e operação | DOC-REVIEW | README explica setup, mocks, cenários, reset, usuários de demonstração e comandos. | Pendente |
| RF-059 | Interface, testes e operação | E2E-02/E2E-11 | Rota inválida mostra fallback; links auxiliares não anunciam sucesso falso. | Pendente |

## RNF e regras críticas

- `RNF-001…RNF-030`: ver [metas e método de prova](../01-visao-geral/requisitos-nao-funcionais.md).
- `RN-001…RN-030`: invariantes devem ser incluídos nos testes relacionados a carrinho, sessão, pedido e eventos.
- **Critérios eliminatórios:** uso real da stack, fluxos completos, receipt só após confirmação, isolamento A/B, socket real em MSW e Playwright executável.

## Como atualizar a matriz

Após rodar teste, registrar versão/commit, ambiente, fixture, resultado e link/caminho da evidência. Não substituir `Pendente` por `Aprovado` apenas porque o teste foi escrito.

[Estratégia de testes](estrategia-de-testes.md) · [Definition of Done](definition-of-done.md).
