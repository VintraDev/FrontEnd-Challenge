import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/session';
import { ProfilePage } from '@/features/profile/profile-page';
export const Route = createFileRoute('/account/')({ component: Page });
function Page() {
  const session = useSession();
  if (session.isPending) return <main role="status">Verificando sessão...</main>;
  if (session.isError)
    return (
      <main role="alert">
        <p>Não foi possível verificar sua sessão.</p>
        <Button onClick={() => void session.refetch()}>Tentar novamente</Button>
        <Link to="/login" search={{ redirect: '/account' }}>
          Entrar
        </Link>
      </main>
    );
  if (!session.data) return <Navigate to="/login" search={{ redirect: '/account' }} replace />;
  return <ProfilePage userId={session.data.user.id} />;
}
