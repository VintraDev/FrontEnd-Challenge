import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { bootstrap } from './app/bootstrap';
import { SessionMonitor } from './app/session-monitor';
import { installSessionLifecycle } from './app/session-lifecycle';
import './styles/globals.css';

const queryClient = new QueryClient();
installSessionLifecycle(queryClient);
const router = createRouter({ routeTree });
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
bootstrap()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <SessionMonitor />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </React.StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error('Falha ao iniciar mocks', error);
    document.getElementById('root')!.textContent = 'Não foi possível iniciar a aplicação.';
  });
