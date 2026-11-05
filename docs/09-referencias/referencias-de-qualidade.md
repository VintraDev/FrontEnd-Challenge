# Referências normativas e guias técnicos

> Estas referências são **apoio externo** à implementação, não novos critérios oficiais do teste. Consultadas como referência em 2026-11-05; confirmar versões quando desenvolver.

## Fonte primária

- [README do desafio — Jungle Gaming](https://github.com/junglegaming/frontend-challenge) — requisitos oficiais de stack, telas, integração, teste e entrega.
- Protótipo no Pencil (pen.dev), acessado pela conexão MCP — composição visual e assets a inspecionar; não foram preenchidos tokens não inspecionados.

## Documentação de plataforma

- [TanStack Router — Search Params](https://tanstack.com/router/latest/docs/guide/search-params) — estado na URL e validação.
- [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) — snapshot, rollback e invalidação.
- [Socket.IO Binding for MSW](https://github.com/mswjs/socket.io-binding) — protocolo e limitações.
- [MSW](https://mswjs.io/) — simulação na camada de rede.
- [Playwright](https://playwright.dev/docs/intro) — testes E2E.

## Engenharia e segurança

- [OWASP ASVS 5.0.0](https://asvs.owasp.org/) — catálogo de controles para aplicações, **não certificação**.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — boas práticas de login e identidade.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — sessão e isolamento.
- [WCAG 2.2 (W3C)](https://www.w3.org/WAI/standards-guidelines/wcag/) — referência de acessibilidade proposta.

## Política de precedência

**Conflito:** README oficial para comportamento; protótipo inspecionado pelo MCP do Pencil para identidade visual, sujeito à validação de correspondência com a referência oficial; requisitos internos/RF e convenções propostas complementam essas fontes. Nenhuma recomendação externa revoga a stack obrigatória.
