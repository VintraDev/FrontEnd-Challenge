# AGENTS.md — Contrato operacional para Codex e agentes

> Este arquivo deve ser lido por todos os agentes antes de modificar código. O autor do projeto revisa o código e verifica as regras do processo seletivo sobre auxílio de IA. O desafio é avaliado por funcionamento e capacidade de defender decisões.

## Documentação obrigatória antes de codificar

1. [`README.md`](README.md) e [`ARCHITECTURE.md`](ARCHITECTURE.md).
2. [`RF`](01-visao-geral/requisitos-funcionais.md), [`RNF`](01-visao-geral/requisitos-nao-funcionais.md), [`RN`](01-visao-geral/regras-de-negocio.md).
3. [`TASKS.md`](TASKS.md) e arquivos específicos da feature.
4. [`Contratos REST`](05-integracoes/especificacao-de-contratos.md) e [`Socket.IO`](05-integracoes/contrato-de-eventos.md).
5. [`Segurança`](06-qualidade/seguranca-aplicacional.md), [`Qualidade de código`](06-qualidade/qualidade-de-codigo.md), [`DoD`](06-qualidade/definition-of-done.md).
6. [README oficial](https://github.com/junglegaming/frontend-challenge) e protótipo do projeto no Pencil (pen.dev), acessado pela conexão MCP. O link do Figma consta no enunciado apenas como referência de origem; não usar Figma para visualizar o protótipo.

## Regras não negociáveis

- Não alterar stack exigida; não substituir TanStack Router por Next App Router.
- Não simular dados com arrays hardcoded nos componentes ou promises fictícias fora do MSW.
- Não importar store/mock/fixtures para UI, hooks de feature ou HTTP client.
- Todo REST usa Axios; queries/mutations via TanStack Query; URL pelo TanStack Router.
- Eventos em tempo real precisam passar por `socket.io-client` + integração da rede MSW; jamais setters/callbacks diretos da UI.
- Usar edição+quantidade válidas, valores ETH decimal string e cotação autoritativa.
- Pedido tem chave idempotente, revalidação e recuperação pós-timeout; só `confirmed` mostra recibo.
- Autorização no MSW por sessão; swap/logout limpa cache e socket da conta anterior.
- Testar loading, empty, error, success, retry e fallbacks, inclusive no mobile e por teclado.
- Não inventar imagens ou fontes nem afirmar fidelidade ao protótipo sem conferir frames e assets pelo MCP do Pencil.
- Não afirmar `build`, `lint`, `test`, `deploy` ou Lighthouse concluídos sem logs/evidências reais.
- Não usar dados reais, segredos nem transações blockchain.
- Não apagar testes para passar pipeline, não aceitar alterações de contrato silenciosas.
- Não publicar repositório, entregar teste ou executar mudanças remotas irreversíveis sem autorização explícita do usuário.

## Ownership — trabalho paralelo

| Responsável | Área | Não pode alterar sem sincronizar |
|---|---|---|
| Arquitetura | `contracts/`, configurações, query keys, auth scope | contratos, outras features |
| Integração | MSW, store, handlers, fixtures, socket binding | schema de API/evento |
| Frontend catálogo | catalog, detail, Router | auth/checkout internals |
| Frontend conta | auth, profile, wallets | key de Query de outras features |
| Frontend compra | cart, checkout, order | domínio de persistência sem acordo |
| Design | `components/ui`, tokens, AppShell | contratos de negócio |
| QA | Playwright, visual, Lighthouse | manipular estado de UI para burlar fluxo |

## Entrada e saída de tarefa

### Antes

1. Ler requisitos RF/RNF/RN da tarefa e interfaces dependentes.
2. Confirmar contratos e dependências estáveis.
3. Definir teste de sucesso, falha, rede lenta e acesso indevido quando aplicável.

### Depois — formato de resposta obrigatório

```text
Task ID e requisito(s):
Arquivos alterados:
Decisões de arquitetura:
Efeitos em contratos, segurança e acessibilidade:
Comandos realmente executados e saída resumida:
Testes e evidências:
Estado: implementado / testado / bloqueado
Limitações e follow-up:
```

## Gate por feature

- [ ] Typecheck, lint e build aplicáveis realmente executados.
- [ ] API simulada e client separados por fronteira de rede.
- [ ] Acessibilidade e comportamento responsivo revisados.
- [ ] E2E ou prova observável para os critérios críticos.
- [ ] Regra de segurança, consistência e domínio respeitada.
- [ ] Docs/ADRs e `TASKS.md` atualizados com status real.

[DoR/DoD](06-qualidade/definition-of-done.md) · [Governança](07-planejamento/governanca-de-mudancas.md).

## Padrão de design no código

- Fonte de valores: frame “Design System / CSS Variables” no Pencil via MCP; implementação central em `src/styles/tokens.css`.
- Componentes e páginas usam tokens semânticos ou de componente para cores, tipografia, espaçamento, raios e bordas. Adições não presentes no Pencil devem ser documentadas como provisórias.
- Execute `npm run check:tokens` para detectar cores literais e paletas padrão em `src`; essa checagem não cobre todas as propriedades de design e não substitui revisão visual e de acessibilidade.
