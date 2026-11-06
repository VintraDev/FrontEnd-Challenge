import { z } from 'zod';

// Test controls are available while MSW is enabled.
export const scenarioSchema = z
  .object({
    auth: z.enum(['default', 'delayed-expired-profile']).optional(),
    wallets: z.enum(['default', 'http-500', 'reject-connection']).optional(),
    quote: z.enum(['default', 'expired']).optional(),
    orders: z.enum(['default', 'decline', 'timeout-after-commit']).optional(),
    favorites: z.enum(['default', 'http-500']).optional(),
    catalog: z.enum([
      'default',
      'empty',
      'http-404',
      'http-500',
      'network-error',
      'slow',
      'price-changed',
      'out-of-stock',
    ]),
  })
  .strict();
export type Scenario = z.infer<typeof scenarioSchema>;
