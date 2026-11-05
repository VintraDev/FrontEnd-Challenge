# Design system e fidelidade visual

O protótipo no Pencil (pen.dev), inspecionado pela conexão MCP, é a referência de composição e o enunciado define o comportamento. O PDF de tokens complementa o protótipo; eventuais divergências devem ser registradas e verificadas antes de decidir.

### 5.1 Camadas de tokens

1. **Primitivos:** valores brutos, por exemplo `--color-brown-950`.
2. **Semânticos:** intenção, por exemplo `--bg-canvas` e `--text-primary`.
3. **Componentes:** uso local, por exemplo `--button-primary-bg`.

O PDF orienta manter as três camadas em CSS, carregar os tokens antes dos componentes e consumir tokens semânticos ou de componente na interface. Evitar cores hexadecimais diretas fora dos tokens.

| Primitivo | Valor | Uso ilustrativo |
|---|---|---|
| `--color-brown-950` | `#140D0A` | Fundo geral |
| `--color-brown-900` | `#241612` | Superfícies |
| `--color-brown-800` | `#2F1D15` | Superfícies elevadas |
| `--color-cream-50` | `#F5F1EB` | Texto principal |
| `--color-sand-300` | `#CFB28C` | Texto secundário |
| `--color-gold-500` | `#D28A4C` | Acento dourado |
| `--color-orange-500` | `#E89B55` | Ação/destaque |
| `--color-coral-500` | `#F0805F` | Acento coral |

O texto extraído do PDF não fornecia valores legíveis para borda e feedback; esses valores foram posteriormente identificados no frame selecionado no Pencil e registrados abaixo. Verificar contraste real, inclusive texto secundário e combinações de estados.

### 5.2 Tipografia e escalas

O PDF indica **Roboto Mono**, com referências de 43 px para display, 32 px para heading, 22 px para title, 16 px para body e 12 px para label; escala de espaçamento de 4, 8, 12, 16, 24, 32, 48 e 64 px e raios de 4, 8, 16, 24 e 40 px. Verificar os frames para pesos, entrelinhas e aplicação responsiva. Manter fontes e imagens disponíveis localmente quando viável.

O PDF cita desktop 1440 px e mobile 414 px; o enunciado também pede avaliar **390, 768 e 1440 px**. Validar os quatro tamanhos, além de zoom e ausência de overflow horizontal.

### 5.3 Componentes e estados

Adaptar shadcn/ui à identidade visual. Prever botões, campos, cards, filtros, navegação, diálogos e drawers com estados de repouso, foco visível, hover, desabilitado, carregando e erro quando aplicável. States não desenhados devem seguir o mesmo sistema visual.

Skeletons com shimmer são obrigatórios para dados carregando, incluindo catálogo, detalhe e resumo do carrinho. Reservar dimensões para reduzir deslocamento e respeitar `prefers-reduced-motion`.

[← Voltar ao índice](../README.md)

## Fundação implementada — 05/11/2026

O frame selecionado **Design System / CSS Variables** foi inspecionado via MCP do Pencil. Ele confirmou os oito tons acima e forneceu borda `#38220F`, sucesso `#59C36A`, erro `#ED1B2E` e informação `#4086F4`. A implementação centraliza primitivos, aliases semânticos e tokens de componentes em `src/styles/tokens.css`; `src/styles/globals.css` conecta os aliases ao Tailwind v4. Roboto Mono 400 e 700 é servido localmente por `@fontsource/roboto-mono`.

O botão compartilhado usa estados primário, hover e desabilitado da referência. A variante outline, o anel de foco, o tamanho mínimo de 48 px e seu padding horizontal são decisões de implementação para acessibilidade e para o diagnóstico existente; precisam ser comparados com os componentes das telas no Pencil. O shell atual continua sendo uma ferramenta de diagnóstico, não uma implementação da Home.

### Regras de consumo

1. Componentes e páginas consomem variáveis semânticas ou de componente; valores brutos pertencem a `tokens.css`. Para Tailwind, utilizar os aliases declarados em `@theme` e a escala de espaçamento baseada em `--space-1`.
2. Definir cores, fontes, tamanhos tipográficos, espaçamentos, raios e bordas no arquivo central; registrar a origem ou a natureza provisória de valores novos. Valores estruturais como largura máxima de container, 100% e unidades de posicionamento não são tokens de identidade visual por si só.
3. Executar `npm run check:tokens`: a checagem detecta cores literais e paletas padrão do Tailwind em arquivos de `src`, exceto o arquivo de tokens. Ela não detecta toda forma de valor literal nem valida contraste; revisão humana e testes continuam necessários.
4. Usar foco visível, estados sem depender apenas de cor, e testar layouts e interações com teclado e viewports previstos. Evitar animação desnecessária e respeitar movimento reduzido quando animações forem introduzidas.
