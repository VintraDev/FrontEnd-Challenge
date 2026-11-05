# Fluxo detalhado — descoberta, filtros e detalhe

**Atores:** visitante/colecionador. **Requisitos:** RF-001–RF-011. **Estado de URL:** `q`, filtros combinados, `sort`, `page`.

```mermaid
sequenceDiagram
  actor U as Usuário
  participant R as TanStack Router
  participant Q as TanStack Query
  participant A as Axios
  participant M as MSW
  U->>R: Selecionar filtros e busca
  R->>R: validateSearch e page=1
  R->>Q: queryKey com parâmetros
  Q->>A: GET /api/nfts?...
  A->>M: Request real interceptado
  alt sucesso
    M-->>A: 200 + total + items
    A-->>Q: Dados tipados
    Q-->>U: Resultados atualizados
  else vazio
    M-->>Q: 200 items=[]
    Q-->>U: Estado vazio + remover filtros
  else timeout / 5xx
    M-->>Q: Erro
    Q-->>U: Feedback + tentar novamente
  end
  U->>R: Voltar / atualizar página
  R->>Q: Restaurar filtros pela URL
```

## Contrato de UX

- Inputs com label; filtros agrupados e removíveis; opção clara para limpar tudo.
- Paginação resetada quando critérios mudam; ordenação isolada do restante.
- Skeleton com altura previsível, mantendo o layout visual durante carregamento.
- No detalhe: URL direta funcional, foto/galeria, preço e estoque por edição, estados de indisponibilidade e quantidade.
- Cancelar requisições antigas via signal; query keys incluem parâmetros normalizados.

## Condições de aceite

- [ ] `?q=arte&page=2` não perde valores após refresh.
- [ ] Combinação de filtros passa todos os valores à API.
- [ ] Requisição lenta antiga não substitui consulta recente.
- [ ] Detalhe inexistente apresenta 404 recuperável.
- [ ] Edição esgotada não permite comprar.

[UC](../casos-de-uso.md) · [Arquitetura de estado](../../03-arquitetura/modelo-de-estado.md).
