import { createFileRoute } from '@tanstack/react-router'
import { searchSchema } from '@/contracts/catalog'
import { HomePage } from '@/features/catalog/home-page'
export const Route = createFileRoute('/')({ validateSearch: (search) => searchSchema.parse(search), component: HomePage })
