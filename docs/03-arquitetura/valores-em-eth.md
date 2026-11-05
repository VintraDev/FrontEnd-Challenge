# Valores em ETH e integridade monetária

Valores ETH devem trafegar e persistir como **strings decimais**, por exemplo `"0.000000000000000001"`. Usar `decimal.js` ou equivalente de precisão decimal para cálculos, sem passar por `number` ou `parseFloat`. Quantidades são inteiras positivas.

Calcular `subtotal - desconto + taxa = total` na camada da API simulada, com regra explícita de precisão e arredondamento. A interface apresenta os valores da cotação. Registrar unidade, escala, limites e formatação adotados; incluir testes de valores pequenos e arredondamento, caso implementados.

[← Voltar ao índice](../README.md)
