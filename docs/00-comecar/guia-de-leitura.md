# Guia de leitura e uso da documentação

A documentação foi escrita como um **mapa da aplicação**: cada pasta responde a um tipo de pergunta, e os arquivos com Mermaid contêm diagramas editáveis.

## Rotas de leitura por perfil

| Perfil / necessidade | Leia na ordem |
|---|---|
| Desenvolvedor começando | [Contexto](../01-visao-geral/visao-e-escopo.md) → [C4](../03-arquitetura/mapa-c4.md) → [Pastas](../03-arquitetura/estrutura-de-pastas.md) → [TASKS](../TASKS.md) |
| Agente trabalhando em feature | [AGENTS](../AGENTS.md) → [TASKS](../TASKS.md) → feature em `02-produto` → contrato em `05-integracoes` → teste em `06-qualidade` |
| Revisor técnico | [Requisitos](../01-visao-geral/matriz-de-rastreabilidade.md) → [Modelo](../03-arquitetura/modelo-de-dados.md) → [Decisões](../03-arquitetura/decisoes-arquiteturais.md) → [Aceitação](../06-qualidade/matriz-de-aceitacao.md) |
| Designers | [Inventário do protótipo no Pencil](../04-design-system/inventario-figma.md) → [Tokens](../04-design-system/tokens-e-componentes.md) → [Acessibilidade](../04-design-system/acessibilidade-e-responsividade.md) |
| Preparar entrega | [Operação](../08-entrega/operacao-local.md) → [Deploy](../08-entrega/deploy-e-validacao.md) → [Checklist](../08-entrega/checklist-final.md) |

## O que é fato e o que é proposta

- **Requisito do desafio**: descrito no README da empresa e reproduzido em resumo nos documentos.
- **Proposta de arquitetura**: escolha entre múltiplas implementações válidas (por exemplo Vite, `decimal.js`, IndexedDB, URLs REST).
- **A verificar**: comportamento não especificado, compatibilidade de versões, resultados de bibliotecas ou detalhes de frames ainda não inspecionados.

A menção a Docker/PostgreSQL é **opcional** e não deve criar dependência de backend real. A referência visual no Pencil ainda exige inspeção dos frames/assets pela conexão MCP e aferição dos tokens; sua correspondência com o design oficial deve ser validada.

## Como ler os diagramas

| Diagrama | Onde está | Responde |
|---|---|---|
| Contexto / containers | [Mapa C4](../03-arquitetura/mapa-c4.md) | Quem conversa com quem? |
| Dependências | [Módulos](../03-arquitetura/fluxo-de-dependencias.md) | O que pode importar o quê? |
| ERD | [Modelo](../03-arquitetura/modelo-de-dados.md) | Quais dados existem e como se relacionam? |
| Jornada | [Fluxos](../02-produto/jornadas-e-fluxos.md) | Como o usuário percorre a aplicação? |
| Sequência | [Sessão](../05-integracoes/autenticacao-e-sessao.md) / [Checkout](../05-integracoes/idempotencia-e-recuperacao.md) | Em que ordem ocorrem as interações? |
| Estados | [Máquinas de estado](../05-integracoes/maquinas-de-estado.md) | Quais transições são permitidas? |

## Como manter o material atualizado

1. Alterar o contrato de dados **antes** dos seus consumidores, justificando a decisão.
2. Atualizar diagrama e critérios de aceite sempre que o comportamento mudar.
3. Registrar evidências reais após executar testes.
4. Quando algo ainda não estiver pronto, marcar `PENDENTE` ou `VALIDAR`, nunca `CONCLUÍDO`.

[Índice principal](../README.md)
