import { z } from 'zod';

/** ETH is transported as a decimal string, never as a JavaScript number. */
export const ETH_DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function normalizeEth(value: string): string {
  const [integerPart, fractionPart] = value.trim().split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '');
  const fraction = fractionPart?.replace(/0+$/, '');

  return fraction ? `${integer}.${fraction}` : integer;
}

export const ethSchema = z
  .string()
  .trim()
  .regex(ETH_DECIMAL_PATTERN, 'Informe um valor ETH decimal válido.')
  .transform(normalizeEth);

export type Eth = z.output<typeof ethSchema>;

export const idSchema = z.string().trim().min(1).max(128);
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const apiErrorCodes = [
  'VALIDATION_ERROR',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'ACCOUNT_EXISTS',
  'EDITION_UNAVAILABLE',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'COUPON_EXPIRED',
  'TRANSIENT_ERROR',
  'UNKNOWN_ORDER_RESULT',
] as const;

export const apiErrorCodeSchema = z.enum(apiErrorCodes).or(z.string().trim().min(1));
export const apiFieldErrorsSchema = z.record(
  z.string(),
  z.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)]),
);
export const apiErrorDetailsSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().trim().min(1),
  fieldErrors: apiFieldErrorsSchema.optional(),
  requestId: idSchema.optional(),
});
export const apiErrorSchema = z.object({ error: apiErrorDetailsSchema });

export type ApiError = z.output<typeof apiErrorSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type Page<T> = z.output<typeof paginationSchema> & { items: T[] };

export function createPageSchema<Item extends z.ZodType>(itemSchema: Item) {
  return z.object({
    items: z.array(itemSchema),
    page: z.coerce.number().int().min(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(9),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
}
