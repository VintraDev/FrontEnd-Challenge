# Pagamento e pedidos

1. Exigir sessão e recuperar carrinho e carteiras da conta.
2. Validar dados do formulário, permitir selecionar carteira e rede e simular conexão, recusa e desconexão.
3. Solicitar cotação com preço, disponibilidade, cupom e taxas. Revalidar antes da confirmação.
4. Se houver mudança, mostrar as diferenças e exigir nova confirmação do usuário; nunca enviar uma cotação vencida ou desatualizada como se estivesse válida.
5. Enviar pedido com chave de idempotência persistente da tentativa. Tratar cliques repetidos, falhas de rede e timeout sem gerar outra compra.
6. Representar `pending`, `confirmed` e `declined`; recuperar o pedido após refresh ou reconexão. Confirmado e recusado são estados terminais.
7. Exibir recibo confirmado a partir de um **snapshot imutável** de itens, preços, descontos, taxas e rede. Referências e links de transação são simulados.

[← Voltar ao índice](../../README.md)
