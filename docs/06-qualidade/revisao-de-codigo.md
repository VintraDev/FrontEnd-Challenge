# Checklist de revisão de código e convenções de contribuição

## Revisão de PR ou milestone

### Produto
- [ ] Tarefa contém IDs de RF/RNF/RN e está dentro do escopo do desafio.
- [ ] Implementou comportamento esperado, erros, estados vazios e recuperação.
- [ ] UI observa o protótipo inspecionado pelo MCP do Pencil e documenta desvio de acessibilidade quando necessário.

### Arquitetura
- [ ] Nenhum import de `mocks/db` vindo de `features`, `routes`, `components` ou `lib/http`.
- [ ] DTOs e contratos estão tipados/validados e cobertos por testes.
- [ ] A query key tem todos os parâmetros; dados privados têm identity scope.
- [ ] Sem duplicar source-of-truth de preço, estoque, pedido ou sessão.
- [ ] Nenhuma dependência circular introduzida.

### Qualidade e segurança
- [ ] Build, typecheck, lint e testes afetados executados e registrados.
- [ ] Sem uso inadequado de `any`, `as unknown as`, `eslint-disable` genéricos.
- [ ] Formulários são acessíveis e validações não se resumem ao cliente.
- [ ] Nenhum token real, senha, chave ou dado pessoal no commit/log.
- [ ] Pending/confirmed/declined corretos e idempotência preservada.
- [ ] 401/logout desconectam socket e limpam cache privado.

### Entrega
- [ ] README e ADR atualizados quando necessário.
- [ ] TASKS marcadas com status real e evidência.
- [ ] Mudanças não quebram deploy público nem refresh de rotas.

## Modelo breve de descrição de mudança

```text
Tarefa: FEAT-XXX
Requisitos: RF-xxx, RNF-xxx, RN-xxx
Resumo da solução:
Contratos alterados:
Testes/comandos executados:
Evidências:
Riscos ou limitações:
```

Um agente pode sugerir revisão, mas alguém deve validar o diff antes de mergear.

[DoD](definition-of-done.md) · [AGENTS](../AGENTS.md).
