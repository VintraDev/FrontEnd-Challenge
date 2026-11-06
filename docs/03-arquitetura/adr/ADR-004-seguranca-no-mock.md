# ADR-004 — Segurança lógica em ambiente totalmente simulado

- **Status:** proposta.
- **Contexto:** dados e autenticação fictícios no cliente não fornecem a segurança de uma API server-side real.
- **Decisão:** testes demonstram isolamento lógico e autorização no domínio do MSW; não usam dados reais; requests privados extraem identidade da sessão e não aceitam userId arbitrário; session teardown cancela cache e eventos.
- **Controles complementares:** não armazenar senhas em claro; omitir logs sensíveis; validar payloads; evitar open redirect e exibir simulações como simulações.
- **Risco residual:** mesmo usando hash/credencial fictícia, usuários podem inspecionar o estado local; não declarar aderência de segurança de produção.
- **Validação:** E2E A/logout/B, tentativas de acessar pedido alheio e injeção de userId no request.

[Segurança](../../06-qualidade/seguranca-aplicacional.md).
