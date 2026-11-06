# Plano de implementação por marcos

A sequência abaixo adapta os marcos dos arquivos enviados e prioriza entregas pequenas, funcionais e verificáveis. Desenvolvimento visual e funcional caminham juntos em cada módulo.

| Marco | Entregas | Como validar antes de avançar |
|---|---|---|
| 0 — Fundação e risco | Vite, TS, Router, Query, Axios, MSW, tokens básicos e teste do binding Socket.IO | Build/preview, REST interceptado e handshake + eventos/reconexão reais no browser; registrar resultados |
| 1 — Dados e descoberta | Contratos, mock store persistente, reset, fixtures, catálogo e detalhe | URL, filtros, paginação, refresh, erros e detalhe direto funcionais |
| 2 — Conta e carrinho | Sessão, favoritos, carrinho, perfil e carteiras | Persistência, validações, rollback, merge e isolamento entre dois usuários |
| 3 — Compra e eventos | Cotação, checkout, pedidos, idempotência, eventos e reconciliação | Compra confirmada, recusa, timeout recuperado e alterações de preço/estoque |
| 4 — Qualidade e entrega | Responsividade, acessibilidade, E2E, visuais, Lighthouse e documentação | Comandos passam, relatórios gerados e limitações registradas |

A arquitetura sugere validar cedo a publicação preliminar e o fallback de rotas. **Publicação, envio de candidatura e commits remotos dependem de autorização explícita**, conforme o arquivo `AGENTS(1).md`. Preparar a entrega local e verificar preview enquanto a autorização não existir.

[← Voltar ao índice](../README.md)
