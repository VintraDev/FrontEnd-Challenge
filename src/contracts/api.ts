import { z } from 'zod'

// Existing handlers use more specific codes; retain them at the transport boundary.
export const standardErrorCodeSchema = z.enum(['VALIDATION', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'OUT_OF_STOCK', 'QUOTE_CHANGED', 'TIMEOUT'])
export type StandardErrorCode = z.infer<typeof standardErrorCodeSchema>
export const apiErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string(), fieldErrors: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional() }) })
export type ApiError = z.infer<typeof apiErrorSchema>
