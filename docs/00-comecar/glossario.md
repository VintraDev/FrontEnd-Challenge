# Glossário de arquitetura e produto

| Termo | Significado neste desafio |
|---|---|
| **MSW** | Mock Service Worker; intercepta solicitações na camada de rede simulando APIs. |
| **Fixture** | Conjunto estável de dados iniciais para desenvolvimento/testes. |
| **Cenário** | Configuração controlável de latência, falha, sessão, preço e resultado de pagamento. |
| **TanStack Router** | Roteamento e parâmetros de URL validados, com histórico e guardas. |
| **TanStack Query** | Cache de estado remoto, mutations, retries, invalidação e revalidação. |
| **Query key** | Identidade da consulta no cache; deve carregar filtros e identidade privada. |
| **Mutation** | Operação que altera dados no serviço simulado. |
| **Idempotência** | Repetir uma tentativa com mesma chave e payload não gera nova compra. |
| **Cotação (`quote`)** | Snapshot autoritativo temporário do preço, taxas, estoque e cupom. |
| **Snapshot** | Cópia imutável dos valores de pedido no momento de sua criação. |
| **Reconciliação** | Reconsulta REST que corrige o estado do cliente depois de eventos, refresh ou reconexão. |
| **Optimistic update** | Atualização imediata da interface, com rollback se a API falhar. |
| **C4** | Modelo de diagramas com níveis de contexto, containers e componentes. |
| **ADR** | Registro de decisão arquitetural e seus trade-offs. |
| **E2E** | Teste de ponta a ponta no navegador com Playwright. |
| **Lighthouse** | Auditoria de performance, acessibilidade, boas práticas e SEO. |
| **Eth string** | Quantia monetária transportada como string decimal, sem float binário. |
| **Terminal state** | Estado de pedido `confirmed` ou `declined`, que não regride. |

[Índice principal](../README.md)
