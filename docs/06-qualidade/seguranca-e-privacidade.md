# Segurança, privacidade e modelo de ameaça da simulação

O marketplace utiliza **apenas dados fictícios**. A camada de backend é simulada no navegador; não há equivalência automática com garantias de segurança de um serviço real.

## Fronteiras que devem ser demonstradas

| Fronteira | Risco | Controle proposto |
|---|---|---|
| Sessão A → Sessão B | Vazamento de pedidos/carrinho/favoritos | Cache privado isolado + teardown/socket cleanup |
| Pedido A acessado por B | Autorização inadequada | Verificação no MSW por identidade, `403/404` |
| Carrinho visitante → usuário | Mistura de identidade | Merge documentado e associar identidade correta |
| `Idempotency-Key` | Duplicação de compras simuladas | Persistência atômica da chave + hash |
| Cotação desatualizada | Pagamento com total incorreto | Revalidação antes de enviar |
| Chave/token em logs | Exposição de credencial demo | Não registrar tokens/senhas, mascarar logs |
| Links externos | Navegação inesperada | Links seguros; ações fora de escopo não simulam êxito |

## Regras para testes

- Pelo menos dois usuários fictícios com dados diferentes.
- Testes A→logout→B verificam que nenhuma consulta ou evento da sessão A afeta B.
- Rota de pedido deve validar propriedade na API, não apenas esconder botão na UI.
- Simular expiracão no checkout e validar retomada segura.

## Limitações do modelo

- Dados persistentes locais podem ser inspecionados no navegador; não inserir credenciais reais.
- Hash ou verificador armazenado no browser não constitui autenticação segura para produção.
- É um teste de coerência de estado e separação lógica, não uma auditoria de segurança de infraestrutura.

[Índice principal](../README.md)
