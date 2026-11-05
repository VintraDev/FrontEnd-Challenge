import { z } from 'zod'
export const healthSchema = z.object({ status: z.literal('ok'), source: z.literal('msw') })
export type Health = z.infer<typeof healthSchema>
