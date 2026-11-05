import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/account/wallets')({ component: Page })
function Page() { return <><h1 className="text-2xl font-bold">Carteiras</h1><p className="mt-3">Esta funcionalidade ainda não foi implementada.</p></> }
