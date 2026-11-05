import { createFileRoute } from '@tanstack/react-router'
import { Diagnostics } from '@/features/diagnostics/diagnostics'
export const Route = createFileRoute('/')({ component: Home })
function Home() { return <><h1 className="mb-4 text-2xl font-bold">Shell do marketplace</h1><Diagnostics /></> }
