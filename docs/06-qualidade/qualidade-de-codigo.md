# Qualidade de código — convenções, princípios e verificação

> **Objetivo:** implementar uma base legível, segura, coesa e explicável na entrevista técnica. Estas práticas são **propostas de engenharia**, além do que o README exige explicitamente.

## Princípios

1. **Single Responsibility:** páginas compõem; features orquestram; hooks acessam dados; services e schemas validam fronteiras.
2. **Dependência unidirecional:** `routes → features → API/contracts`, nunca UI → mocks/store.
3. **KISS/YAGNI:** não criar abstrações genéricas antes de um segundo caso legítimo.
4. **Tipagem de fronteira:** dados recebidos da rede são `unknown` até validados. `any` proibido sem justificativa registrada.
5. **Erros são comportamento do produto:** não engolir erros e não marcar sucesso antes de resposta da simulação.
6. **Dados remotos:** Query gerencia cache; não duplicar source-of-truth em `useState`.
7. **Imutabilidade:** alterações de estado e cache produzem estruturas novas e versões corretas.
8. **Observabilidade:** logs úteis, sem tokens/senhas ou informações de usuários reais.

## Padrão por feature

```text
features/<feature>/
├── api/
│   └── <feature>.api.ts          # Axios e DTOs
├── components/
│   └── <feature>-view.tsx        # apresentação
├── hooks/
│   └── use-<feature>.ts          # hooks e queries
├── schemas/
│   └── <feature>.schema.ts       # Zod
├── model/
│   └── <feature>.types.ts        # tipos internos
├── __tests__/
│   └── <feature>.test.ts         # testes isolados
└── index.ts                      # API pública
```

Nomes e paths são proposta de convenção, não estrutura já existente.

## TypeScript e React

- `strict: true`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` conforme compatibilidade do setup; nenhuma variável não usada.
- Componentes com `PascalCase`; funções/hooks `camelCase`; hooks `use...`; arquivos coerentes e previsíveis.
- Nunca interpolar HTML não confiável via `dangerouslySetInnerHTML`.
- Efeitos para sincronização externa, não para derivar estados que podem ser computados durante renderização.
- Prefira forms controlados/React Hook Form + Zod; validação dos dois lados da fronteira (UI e API).
- `React.memo` e `useMemo` somente onde medições justificarem.

## Exemplo de separação (esquemático)

```ts
// features/catalog/api/catalog.api.ts — ilustração
export async function getCatalog(params: CatalogSearch, signal?: AbortSignal) {
  const { data } = await http.get('/api/nfts', { params, signal });
  return catalogResponseSchema.parse(data);
}

// features/catalog/hooks/use-catalog.ts — ilustração
export function useCatalog(params: CatalogSearch) {
  return useQuery({
    queryKey: ['catalog', params],
    queryFn: ({ signal }) => getCatalog(params, signal),
  });
}
```

## Ferramentas e scripts a incluir

| Script proposto | Intenção | Critério |
|---|---|---|
| `typecheck` | `tsc --noEmit` | sem erro |
| `lint` | ESLint React Hooks + TS | sem erro |
| `format:check` | Prettier | arquivos padronizados |
| `test` | Unit/component/contract | testes passam |
| `test:e2e` | Playwright | cenários críticos passam |
| `build` | bundle de produção | sem falha |
| `preview` | testar build | rotas/mocks funcionais |
| `audit` | Lighthouse | relatórios preservados |

## Pull request / mudança pequena

- [ ] Identificador de tarefa, requisito e motivação descritos.
- [ ] Sem alteração de contrato sem schema/versionamento/teste.
- [ ] Sem dependências desnecessárias, lógica de negócio no UI ou segredos.
- [ ] UI inclui acessibilidade, responsividade, erros e loading.
- [ ] Testes e documentação atualizados; comandos realmente executados listados.

[Contratos dos componentes](../04-design-system/contrato-de-componentes.md) · [Definition of Done](definition-of-done.md).
