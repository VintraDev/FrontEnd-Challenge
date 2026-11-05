import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
export const Route = createRootRoute({ component: Root, notFoundComponent: () => <p>Página não encontrada.</p> })
function Root() {
  return <div className="mx-auto max-w-4xl p-6"><header className="mb-8 border-b border-border pb-4"><Link to="/" className="font-bold">NFT Marketplace</Link><p className="text-sm text-muted-foreground">Fundação técnica — funcionalidades ainda não implementadas</p></header><main><Outlet /></main></div>
}
