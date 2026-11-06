# Stack e responsabilidades

| Tecnologia | Papel obrigatório |
|---|---|
| React + TypeScript | Interface e tipagem |
| TanStack Router | Rotas, parâmetros de busca e proteção das áreas privadas |
| TanStack Query | Consultas, mutations, cache e sincronização |
| Axios | Todas as chamadas REST da aplicação |
| REST | Contratos entre interface e camada simulada |
| Socket.IO / `socket.io-client` | Consumo efetivo de eventos em tempo real |
| Tailwind CSS | Estilização |
| shadcn/ui | Base de componentes, adaptada ao design |
| MSW | Interceptação de rede e simulação de cenários |
| Playwright | Testes E2E e regressão visual |
| Lighthouse | Auditorias de qualidade e desempenho |

**Proposta complementar:** Vite como build, Zod para validação, React Hook Form para formulários, `decimal.js` para valores em ETH e IndexedDB para persistência do repositório simulado. Essas escolhas vêm da arquitetura proposta; devem ser confirmadas na implementação. Next.js não está previsto na proposta atual.

[← Voltar ao índice](../README.md)
