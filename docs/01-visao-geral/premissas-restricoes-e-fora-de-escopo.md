# Premissas, restrições, escopo e pendências

## Exigido pelo processo seletivo

- React e TypeScript, TanStack Router/Query, Axios, REST, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright, Lighthouse.
- Telas da Home ao perfil, com variantes desktop/mobile, conforme protótipo inspecionado pelo MCP do Pencil.
- Backend e carteiras **simulados**, sem blockchain real ou pagamentos reais.
- Repositório + deploy público independente de serviços privados.
- Fixtures, cenários de falha, testes, medição de qualidade e documentação para reprodução.

## Explicitamente fora de escopo

- Integrações reais com blockchain, carteiras externas, processadores de pagamento.
- Páginas editoriais, suporte, atividade, ofertas e downloads.
- Backend produtivo, PostgreSQL Docker, serviços pagos ou chaves reais **não são necessários**.

## Decisões arquiteturais propostas

- Vite como build; Zod para validação e decimal.js para valores em ETH.
- MSW no navegador com repositório persistente simulado, sem PostgreSQL para demonstração.
- Fluxos verticais, com testes e UI dentro da mesma entrega.
- Referência de acessibilidade: WCAG 2.2 AA; alvo adicional de qualidade, não substitui os limiares Lighthouse do desafio.

## Não inferir do README

- Regras de negócio numéricas e de desconto/cupom não fornecidas devem ser propostas e documentadas.
- Cor, tokens, nome de fonte e assets: requerem inspeção do protótipo pelo MCP do Pencil e inventário.
- Valores de timeout de sessão, cotação, limite de itens e paginação: parametrizáveis, com política registrada.
- Funções e endpoints exatos são **desenho da solução**, não backend oficial disponibilizado.

## Registro de dúvidas

| Pergunta | Motivo | Ação |
|---|---|---|
| O protótipo no Pencil permite exportação via MCP e contém todos os assets? | Fidelidade visual | Inventariar frames/assets |
| O binding Socket.IO funciona com a versão escolhida de MSW? | Eliminatório | Spike POC antes da UI |
| O reset preserva determinismo entre contextos Playwright? | Estabilidade de E2E | Testar isoladamente |
| Qual o destino de links externos do layout? | Fora do escopo | Sem simular sucesso |

[ADRs](../03-arquitetura/decisoes-arquiteturais.md) · [Riscos](../07-planejamento/riscos-e-contingencias.md).
