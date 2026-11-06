# Frontend Challenge — fundação

Fundação, catálogo, detalhe e carrinho de visitante estão parcialmente implementados. Cadastro, login e sessão simulados estão parcialmente disponíveis; favoritos estão disponíveis para usuários autenticados; checkout completo e pedidos ainda estão pendentes.

## Execução

Requer Node.js compatível com as versões do lockfile (validado com Node 26.12.0) e npm.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview
npx playwright install chromium
npm run test:smoke
SMOKE_PREVIEW=1 npm run test:smoke
```

Para usar um Chromium já instalado, informe, por exemplo, `CHROMIUM_PATH=/usr/bin/chromium`. O servidor dos testes usa a porta 4173. Mocks estão ativos por padrão também no build de preview; `VITE_ENABLE_MOCKS=false` os desativa na compilação, portanto o diagnóstico não terá backend sem um servidor real. O service worker requer localhost ou contexto seguro.

## Resultado da prova de conceito — 04/11/2026

Com Chromium do sistema e Node 26.12.0, `npm run typecheck` e `npm run build` passaram. `CHROMIUM_PATH=/usr/bin/chromium npm run test:smoke` e `CHROMIUM_PATH=/usr/bin/chromium SMOKE_PREVIEW=1 npm run test:smoke` passaram: 2 testes em cada ambiente. O primeiro observa `GET /api/health` via Axios/MSW, conexão Socket.IO, envio do evento `probe` pelo cliente, recebimento de `nft.updated` e `order.updated` pelo cliente, e uma nova conexão iniciada pelo botão. O segundo verifica rota direta, refresh e 404.

O cliente força transporte WebSocket e usa namespace padrão. O pacote publicado `@mswjs/socket.io-binding@0.2.0` expõe `toSocketIo`, diferente da API presente na documentação da branch principal; seu README informa que o wrapper não tem paridade completa, incluindo recursos como namespaces, salas e broadcast. Esta prova usa somente eventos simples e não valida acknowledgements ou binários. O MSW remove `/socket.io/` antes de comparar a URL do handler, que por isso usa `/`.

A primeira tentativa falhou por usar MSW 3, incompatível com o peer declarado do binding; foi ajustada para MSW 2. Outra tentativa falhou no build por usar a API da branch principal, e a primeira execução no navegador não conectou por correspondência incorreta da URL; ambas foram corrigidas antes dos testes acima. O primeiro teste no sandbox também não iniciou o servidor por `EPERM` ao abrir porta; foi executado com acesso local autorizado.

A nova conexão testada é explícita, não comprova recuperação automática após interrupção. Persistência, cenários de falha, tolerância a duplicatas/eventos antigos, reconciliação REST, isolamento de sessão, fluxo de compra, telas fiéis ao Figma, E2E de produto, snapshots visuais, Lighthouse, lint e publicação permanecem pendentes. Nenhum deploy foi realizado.

## Carrinho simulado de visitante

O carrinho é persistido no IndexedDB do navegador pelo mock MSW. Adicione itens a partir do detalhe. O cupom fictício `KURIO10` aplica 10% e `EXPIRADO` retorna erro; a taxa estimada da simulação é 0.016 ETH. A cotação é calculada por Decimal no mock e vinculada à versão do carrinho. O carrinho ainda é compartilhado como visitante mesmo após login; carrinhos por conta e merge ainda não foram implementados. A revisão de checkout requer login e continua sendo uma prévia. Para limpar os dados de demonstração, remova o banco `kurio-mock-store` nas ferramentas do navegador.


## Login de demonstração

Contas fictícias: `ana@kurio.test` / `KurioDemo123!` e `bruno@kurio.test` / `KurioDemo456!`. O login usa Axios e MSW, e a sessão expira após 24 horas. O token de demonstração fica no armazenamento local, e o repositório simulado de sessões fica em IndexedDB (`kurio-mock-auth`); senhas não são armazenadas em texto puro. Este mecanismo é apenas uma simulação local e não oferece segurança de produção.

O carrinho ainda não é isolado por conta nem mesclado no login. Dados privados, logout de socket vinculado à sessão, expiração em tempo real durante uma tela aberta e cenários determinísticos de falha continuam pendentes.

O cadastro cria uma conta fictícia persistida no IndexedDB e inicia sessão; os e-mails são normalizados e duplicatas retornam conflito. Novas senhas são verificadas com PBKDF2 e salt aleatório no mock. Contas e sessões locais são apenas para demonstração e podem ser inspecionadas no navegador.


O perfil simulado em `/account` permite editar nome, nome de usuário, ENS, apelido e avatar, além de alterar a senha. O usuário pode selecionar PNG, JPEG ou WebP de até 10 MB; a aplicação corrige a orientação quando suportada, redimensiona, converte para WebP e limita o avatar persistido a 500 KB. Os dados são associados à sessão e persistem em `kurio-mock-auth`; o e-mail permanece somente para leitura.


## Cenários de teste MSW

Com mocks ativos, `POST /api/__test/scenario` recebe JSON como `{ "catalog": "http-500" }`. Valores aceitos: `default`, `empty`, `http-404`, `http-500`, `network-error`, `slow`, `price-changed` e `out-of-stock`. A latência simulada é de 1200 ms; erros de rede/HTTP, vazio e latência afetam a listagem. Alteração de preço e estoque afeta o NFT `nft-1` na listagem, detalhe e carrinho/cotação, sem emitir eventos Socket.IO.

`POST /api/__test/reset` restaura o cenário e limpa os dados existentes dos mocks (sessões, cadastros, perfis, favoritos, carteiras e carrinho visitante). Recarregue a página e remova `kurio-demo-session` do armazenamento local para limpar também a identidade em cache no cliente. O reset das duas bases é sequencial e recursos ainda não implementados não são cobertos.


## Favoritos

Acesse `/favorites` pelo menu inferior no mobile ou pela lista de interesse do perfil. No detalhe do NFT, use o botão de favoritos; visitantes são direcionados ao login e retornam ao NFT. `GET /api/favorites`, `POST /api/favorites` e `DELETE /api/favorites/:nftId` usam a sessão atual e persistem IDs por usuário no IndexedDB `kurio-mock-favorites`. A interface usa atualização otimista com reversão e reconsulta em caso de erro. `POST /api/__test/reset` limpa favoritos junto dos demais dados dos mocks. Para simular falha de inclusão/remoção, configure `POST /api/__test/scenario` com `{ "catalog": "default", "favorites": "http-500" }`.


## Carteiras de demonstração

A página `/account/wallets` permite cadastrar e editar uma carteira principal e uma secundária por usuário. Os campos são validados via Zod e pelos endpoints autenticados `GET /api/wallets`, `POST /api/wallets` e `PATCH /api/wallets/:walletId`; os dados persistem no IndexedDB `kurio-mock-wallets` e são apagados no reset. Use apenas dados fictícios: não informe chave privada nem frase de recuperação. A seleção no checkout, conexão simulada, recusa e desconexão ainda não estão implementadas. A falha de gravação pode ser reproduzida com `{ "catalog": "default", "wallets": "http-500" }` em `POST /api/__test/scenario`.
