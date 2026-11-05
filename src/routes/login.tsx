import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/features/auth/login-page'
export const Route = createFileRoute('/login')({ validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === 'string' ? search.redirect : undefined }), component: Page })
function Page() { const { redirect } = Route.useSearch(); return <LoginPage redirect={redirect} /> }
