# Atores, perfis de acesso e autorização

## Atores

- **Visitante:** navega por catálogo/detalhes, usa busca e mantém carrinho visitante. Não acessa operações privadas.
- **Colecionador autenticado:** visitante com sessão válida; compra simulada, favoritos, perfil, carteiras e pedidos.
- **Camada simulada de API (MSW):** valida permissão pelo contexto da sessão e mantém dados de domínio. É ator técnico, não perfil humano.
- **Sistema de eventos Socket.IO:** propaga versões/alterações da simulação, sem permitir consulta de dados privados de outra sessão.
- **Avaliador Playwright:** executa cenários determinísticos e limpa fixtures no começo de cada teste.

## Matriz de autorização

| Funcionalidade | Visitante | Colecionador autenticado | Observações |
|---|:---:|:---:|---|
| Catálogo/detalhe | ✓ | ✓ | URLs públicas |
| Carrinho | ✓ | ✓ | Visitante → merge no login |
| Favoritos | ✕ | ✓ | Escopo do proprietário |
| Checkout e cotação final | ✕ | ✓ | Retorno à intenção após login |
| Pedidos/recibo | ✕ | ✓ | Só titular; validar na API |
| Perfil/senha/avatar | ✕ | ✓ | Persistente no mock |
| Carteiras | ✕ | ✓ | Principal e secundária |
| Reset de fixtures | Ambiente de teste | Ambiente de teste | Controle dedicado; nunca interação de produto |

## Sequência de proteção

```mermaid
sequenceDiagram
  actor U as Usuário
  participant R as Router
  participant API as Axios/MSW
  participant D as Store simulado
  U->>R: /account/wallets
  R->>API: GET /api/auth/session
  API->>D: Identificar sessão
  alt inválida
    API-->>R: 401
    R-->>U: /login?redirect=/account/wallets
  else válida
    API-->>R: userId da sessão
    R->>API: GET /api/wallets
    API->>D: Listar somente userId atual
    D-->>U: Carteiras permitidas
  end
```

**Invariante:** esconder links não é autorização. Mesmo que o visitante conheça URLs e identificadores, MSW deve recusar recursos privados sem sessão/dono correto.

[Regras de negócio](regras-de-negocio.md) · [Segurança](../06-qualidade/seguranca-aplicacional.md).
