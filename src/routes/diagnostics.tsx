import { createFileRoute } from '@tanstack/react-router';
import { Diagnostics } from '@/features/diagnostics/diagnostics';
export const Route = createFileRoute('/diagnostics')({ component: Diagnostics });
