# Conta, sessão e carteiras

- Cadastro, login, consulta de sessão, expiração e logout funcionam pela API simulada. Validar campos e mostrar erros vindos da API.
- Recuperar sessão após refresh; se expirar durante o checkout, preservar contexto e permitir retomada segura após login.
- No logout ou troca de conta, cancelar consultas em andamento, desconectar socket, remover listeners e limpar o cache privado da sessão anterior.
- Persistir alterações confirmadas de perfil, avatar, senha e carteiras. Não armazenar senhas em texto claro nem registrar credenciais ou tokens em logs.
- Credenciais e dados são fictícios. A arquitetura admite token local apenas para demonstração; isso não constitui um modelo seguro de autenticação para produção.

[← Voltar ao índice](../../README.md)
