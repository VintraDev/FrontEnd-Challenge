import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/features/auth/register-page'
export const Route = createFileRoute('/register')({ validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === 'string' ? search.redirect : undefined }), component: Page })
function Page() { const { redirect } = Route.useSearch(); return <RegisterPage redirect={redirect} /> }
