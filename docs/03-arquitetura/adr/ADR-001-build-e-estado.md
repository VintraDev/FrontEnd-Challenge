# ADR-001 — Build, roteamento e fonte da verdade

- **Status:** proposta / a validar no bootstrap.
- **Problema:** precisamos demonstrar a stack exigida com risco mínimo de conflito e operação sem backend privado.
- **Decisão:** Vite + React + TypeScript strict; TanStack Router como único sistema de rotas; TanStack Query para estado remoto; Axios para REST; MSW com store simulado como backend da demonstração.
- **Alternativas:** Next.js App Router com TanStack Router (conflito e custo adicional); backend Node+Postgres como fonte principal (custo de deploy; não substitui mocks).
- **Consequências positivas:** query URL estável; setup reduzido; browser mocks; tests controláveis.
- **Riscos:** MSW/Socket.IO exige validação técnica; persistência no navegador não é segurança de produção.
- **Validação:** build, rotas após refresh, REST via MSW e socket.io-client usando binding real; E2E smoke.

[Arquitetura](../limites-e-responsabilidades.md) · [Spike](../../07-planejamento/spikes-e-dependencias.md).
