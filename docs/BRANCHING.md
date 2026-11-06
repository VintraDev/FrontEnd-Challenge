# Fluxo de branches

```text
developer → pull request com quality gate aprovado → main
```

- Todo desenvolvimento é integrado primeiro em `developer`.
- `main` recebe apenas pull requests cuja origem é `developer`.
- Os checks obrigatórios são **Quality Gate / branch flow** e **Quality Gate / quality**.
- Não fazer push direto em `main`, merge sem o check ou force push em branches compartilhadas.
- Antes de abrir a PR, executar `npm run quality:gate` localmente.

## Proteção remota de `main`

No GitHub, configurar uma branch rule/ruleset para `main` com:

- pull request obrigatório;
- checks obrigatórios `Quality Gate / branch flow` e `Quality Gate / quality`;
- branch desatualizada bloqueada até atualizar com `developer`;
- force push e exclusão da branch bloqueados.
