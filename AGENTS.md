# Instruções para agentes — Frontend Challenge

1. Leia integralmente `ARCHITECTURE.md` e o README oficial em https://github.com/junglegaming/frontend-challenge antes de alterar código.
2. Este é um desafio avaliativo com prazo curto. Não diga que algo está concluído sem build/teste/inspeção funcional.
3. Stack obrigatória: React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse.
4. Primeiro milestone: inicializar Vite, Router, Query, MSW e testar `socket.io-client` usando MSW + `@mswjs/socket.io-binding` no browser e preview; registrar resultado.
5. Separar `features`, `contracts`, `lib` e `mocks`. A UI acessa dados exclusivamente por endpoints Axios e eventos `socket.io-client`.
6. Não fazer mock em componentes, hooks ou cliente HTTP; não atualizar Query Cache diretamente para falsificar um evento de socket.
7. Valores ETH como strings decimais (Decimal para cálculos), quantidades inteiras. O mock REST é a fonte da verdade.
8. Checkout com cotação atualizada, idempotência persistente da tentativa, pedido pendente, confirmado/recusado, recuperação após timeout e recibo snapshot.
9. Sessões isoladas por usuário; logout precisa cancelar consultas, desconectar socket e limpar caches privados.
10. Definir cenários reproduzíveis de sucesso, erro HTTP, latência, sessão expirada, preço alterado, pedido duplicado, eventos velhos/duplicados e reconexão.
11. Implementar E2E reais Playwright com cenários resetáveis e capturas visuais no mínimo das telas principais; auditar Lighthouse.
12. Respeitar o Figma desktop e mobile; interfaces acessíveis e estados de loading/vazio/erro.
13. A cada etapa, produzir resumo de arquivos modificados, funcionalidades comprovadas, comandos executados, testes realmente passados e pendências. Não fingir resultados.
14. Não executar publicação, envio da candidatura ou commits remotos sem autorização explícita do usuário.

## Ordem de trabalho

- Milestone 0: configurar repo, packages, plugins, rotas e smoke tests de rede MSW + websocket.
- Milestone 1: contratos e repositório mock persistente, fixtures e reset; catalogue + detalhes.
- Milestone 2: auth + favoritos + carrinho + perfil e carteiras.
- Milestone 3: cotação, checkout, pedidos idempotentes e eventos em tempo real com reconciliação.
- Milestone 4: responsividade, a11y, E2E, Lighthouse, deploy e documentação.

Preferir incrementos pequenos, executáveis e revisáveis. Não trocar a stack obrigatória por alternativas convenientes.

## Design system

- Consultar o frame “Design System / CSS Variables” no Pencil via MCP e `docs/04-design-system/tokens-e-componentes.md` antes de alterar UI.
- Centralizar valores de design em `src/styles/tokens.css`: primitivos, aliases semânticos e tokens de componentes. Interface e componentes devem usar tokens semânticos/de componente para cores, tipografia, espaçamento, raios e bordas; utilitários Tailwind devem apontar para esses tokens.
- Não usar cores literais nem paletas Tailwind padrão em componentes. Executar `npm run check:tokens`; a verificação cobre cores, não substitui revisão dos demais valores.
- Novos valores sem correspondência no Pencil devem ser identificados como decisão provisória, justificados e centralizados. Validar foco, contraste, estados, responsividade e movimento reduzido quando aplicáveis.
