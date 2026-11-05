# Frontend Challenge — fundação

Implementação limitada ao primeiro milestone. As rotas exibem placeholders e não representam funcionalidades do marketplace.

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
