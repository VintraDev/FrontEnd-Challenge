# Fontes, precedência e limites desta especificação

## Fontes de requisitos e referências

1. [Repositório oficial / README do desafio](https://github.com/junglegaming/frontend-challenge) — fonte normativa de escopo, stack, critérios, metas e entrega; **consultado e comparado** com o texto anexo disponibilizado no chat.
2. Protótipo no Pencil (pen.dev), acessado pela conexão MCP — referência para inspeção visual; **a disponibilidade e a correspondência com o design oficial, bem como o inventário completo de frames e assets, ainda devem ser validados**. O [Figma citado no enunciado](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) é preservado apenas como referência de origem e não será usado para visualizar o protótipo.
3. Arquivo do usuário `NFT_Marketplace_Documentacao(1).zip` — base documental preservada e ampliada nesta edição.
4. Arquivos anteriores `AGENTS.md` e `ARCHITECTURE.md` — decisões propostas integradas e detalhadas aqui.
5. [TanStack Router com Vite](https://tanstack.com/router/latest/docs/installation/with-vite) — plugin e geração de rotas.
6. [MSW Socket.IO binding](https://github.com/mswjs/socket.io-binding) — suporte e limitações do protocolo, exigindo teste de compatibilidade.

## Regras de precedência

**Enunciado oficial** define o comportamento obrigatório; o protótipo disponível no Pencil, inspecionado via MCP, orienta a aparência e a composição; **documentação deste pacote** especifica uma arquitetura candidata. Registrar eventuais divergências com a referência oficial e decisões de UX; a correspondência entre as referências ainda precisa ser validada.

## Limitações explícitas

- Não inspecionamos detalhadamente os frames do protótipo pelo MCP do Pencil para inventariar assets, páginas ou tokens ausentes.
- URLs REST, schema persistente, mecanismos de idempotência e nomes de pastas são **propostos**, não endpoints de um backend oficial.
- Esta entrega contém **somente documentação**; não há código fonte da aplicação, bancos, containers, testes executados, screenshots de validação, deploy nem relatórios Lighthouse.
- A integração de Socket.IO via MSW tem limitações conhecidas e **não foi validada executando o app**; prova de conceito é bloqueadora.
- O tempo de implementação é extremamente limitado para o escopo integral; critérios eliminatórios devem ser priorizados na sequência de tarefas.

[Índice principal](../README.md)
