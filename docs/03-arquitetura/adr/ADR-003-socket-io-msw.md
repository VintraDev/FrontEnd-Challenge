# ADR-003 — Simulação de Socket.IO com MSW

- **Status:** decisão condicionada ao spike.
- **Problema:** README exige `socket.io-client` efetivo e eventos do domínio por mock da rede, sem atalhos por callback/setter da UI.
- **Decisão proposta:** MSW WebSocket API + `@mswjs/socket.io-binding`, namespace padrão, eventos textuais, versão/identity scope e reconciliação por REST.
- **Restrições conhecidas da integração:** binding não suporta namespaces customizados, acknowledgements e anexos binários; verificar versões e compatibilidade atual no ambiente escolhido.
- **Plano de validação:** conectar cliente → handshake → emitir `nft.updated` → observar resposta via client → atualizar consulta → disconnect/reconnect → reconsultar REST.
- **Contingência:** registrar falha e investigar compatibilidade sem trocar para eventos simulados na UI, pois isso não atende ao README.

[Binding oficial](https://github.com/mswjs/socket.io-binding) · [Tempo real](../../05-integracoes/tempo-real.md).
