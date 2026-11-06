# ADR — Registros de decisão arquitetural

Use `status: proposta | aceita | substituída` e registre data/evidência quando uma decisão for validada. As ADRs abaixo estão **propostas**, não aceitas pela implementação.

## ADR-001 — Vite + React no lugar de Next.js
- **Contexto:** TanStack Router é obrigatório, Next possui roteamento próprio.
- **Decisão:** Vite com React + TypeScript estrito e plugin oficial do TanStack Router.
- **Benefício:** menor complexidade e suporte direto a rotas baseadas em arquivos.
- **Custo:** não usar SSR nativo do Next; SEO deve ser tratado dentro das metas Lighthouse da SPA.
- **Status:** proposta.

## ADR-002 — Mock REST como fonte da verdade
- **Contexto:** avaliação exige API simulada e execução sem backend privado.
- **Decisão:** handlers MSW delegam a serviços do mock store; UI só usa Axios.
- **Benefício:** cenários reproduzíveis e fluxo demonstrável offline de serviços externos.
- **Custo:** necessidade de persistência, reset e simulação transacional.
- **Status:** proposta.

## ADR-003 — Persistência browser e PostgreSQL opcional
- **Decisão:** usar IndexedDB ou adaptador equivalente para mocks; não exigir Docker/PostgreSQL no deploy ou E2E.
- **Alternativa rejeitada no caminho crítico:** backend Node + PostgreSQL local.
- **Motivo:** aumentaria a infraestrutura e não substituiria o requisito MSW.
- **Status:** proposta; escolher biblioteca/adaptador após prova de conceito.

## ADR-004 — `socket.io-client` sobre binding MSW
- **Decisão:** usar MSW WebSocket com `@mswjs/socket.io-binding`, namespace padrão, texto e transporte WebSocket.
- **Risco:** binding não suporta namespaces customizados, acknowledgements e payloads binários; integração real precisa passar em browser, preview e deploy.
- **Status:** **VALIDAR** por spike técnico prioritário.

## ADR-005 — ETH como string decimal
- **Decisão:** transporte/persistência em string decimal e cálculos com `decimal.js`, quantidades em inteiro.
- **Benefício:** evita erros de ponto flutuante e inconsistência no recibo.
- **Status:** proposta.

## ADR-006 — Arquitetura por features e contratos
- **Decisão:** `routes -> features -> lib/contracts`; `mocks -> contracts/mocks-db`; UI sem importação de mock.
- **Benefício:** responsabilidade explícita e possibilidade de agentes paralelos após contratos estáveis.
- **Status:** proposta.

## ADR-007 — Aplicação publicada independente
- **Decisão:** SPA com fallback para `index.html`, MSW em build de demonstração, assets/fontes presentes localmente.
- **Atenção:** verificar Socket.IO interceptado e atualização via refresh na hospedagem escolhida.
- **Status:** proposta; evidenciar depois do deploy.

[Índice principal](../README.md)
