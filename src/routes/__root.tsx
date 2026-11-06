import { createRootRoute, Outlet } from '@tanstack/react-router';
export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="mx-auto max-w-4xl p-6">
      <p>Página não encontrada.</p>
    </main>
  ),
});
