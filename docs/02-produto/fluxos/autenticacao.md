# Fluxo detalhado — login, sessão e troca de usuário

**Requisitos:** RF-012–RF-022, RN-006, RN-020–RN-022. O backend simulado é responsável por autorização, não apenas o guard da UI.

```mermaid
sequenceDiagram
  actor U as Usuário
  participant R as Router
  participant H as Auth hook
  participant API as Axios / MSW
  participant Q as QueryClient
  participant S as Socket client
  U->>R: Acessa /checkout sem sessão
  R-->>U: Login com redirect local
  U->>H: Credenciais fictícias
  H->>API: POST /api/auth/login
  API-->>H: Sessão validada
  H->>Q: Criar scope da identidade
  H->>S: Conectar listeners da conta
  H-->>R: Retornar /checkout
  U->>H: Logout / troca de usuário
  H->>Q: Cancelar queries privadas
  H->>S: Desconectar e remover listeners
  H->>Q: Limpar dados do usuário anterior
  H->>API: POST /api/auth/logout
  H-->>R: Anônimo / nova sessão
```

## Três pontos que evitam vazamentos

1. **API:** extrai `userId` da sessão, nunca do body enviado pelo cliente.
2. **Query:** keys privadas sempre têm scope de usuário/sessão; cancelar e remover cache antigo na troca.
3. **Socket.IO:** listeners associados à sessão têm cleanup; eventos antigos são ignorados por identidade/epoch.

## Falhas obrigatórias

- Login inválido: mensagem genérica, sem expor qual campo existe no sistema.
- Sessão expirada: redirecionar com intenção segura, sem perder carrinho, mas revalidando cotação.
- Duas contas no teste: nunca mostrar carteira/pedido/favorito do usuário A após login como B.
- Cadastro conflitante: 409 com erro de campo e opção de login.

[Autorização](../../01-visao-geral/atores-e-permissoes.md) · [Segurança](../../06-qualidade/seguranca-aplicacional.md).
