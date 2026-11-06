import { z } from 'zod'

// Test controls affect only GET /api/nfts and are available while MSW is enabled.
export const scenarioSchema = z.object({
  wallets: z.enum(['default', 'http-500']).optional(),
  favorites: z.enum(['default', 'http-500']).optional(),
  catalog: z.enum(['default', 'empty', 'http-404', 'http-500', 'network-error', 'slow', 'price-changed', 'out-of-stock']),
}).strict()
export type Scenario = z.infer<typeof scenarioSchema>
