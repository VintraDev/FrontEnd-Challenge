# Catálogo e detalhes

- Persistir busca, filtros, ordenação e página na URL, inclusive após refresh e histórico do navegador; validar e normalizar parâmetros.
- Permitir filtros combinados; ao mudar um filtro, retornar para a primeira página. Consultas e `queryKey` devem refletir os parâmetros aplicados.
- Tratar carregamento, resultado vazio, falha e respostas fora de ordem. Cancelar ou descartar respostas obsoletas.
- O detalhe deve abrir diretamente por URL e tratar NFT inexistente, edição esgotada e quantidade acima do estoque.
- Favoritos pertencem ao usuário autenticado e persistem após refresh. Uma proposta é usar atualização otimista com rollback se a API falhar.

[← Voltar ao índice](../../README.md)
