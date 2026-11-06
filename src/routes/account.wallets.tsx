import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/session'
import { WalletsPage } from '@/features/wallets/wallets-page'

export const Route = createFileRoute('/account/wallets')({ component: Page })
function Page() {
  const session = useSession()
  if (session.isPending) return <main role="status">Verificando sessão...</main>
  if (session.isError) return <main role="alert"><p>Não foi possível verificar sua sessão.</p><Button onClick={() => void session.refetch()}>Tentar novamente</Button><Link to="/login" search={{ redirect: '/account/wallets' }}>Entrar</Link></main>
  if (!session.data) return <Navigate to="/login" search={{ redirect: '/account/wallets' }} replace />
  return <WalletsPage key={session.data.user.id} userId={session.data.user.id} />
}
