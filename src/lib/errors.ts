import axios from 'axios';
import { apiErrorSchema } from '@/contracts/api';

export type ErrorKind =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'QUOTE_CHANGED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'TRANSIENT_ERROR'
  | 'CANCELLED'
  | 'UNKNOWN';
export interface NormalizedApiError {
  kind: ErrorKind;
  code?: string;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string | string[]>;
}

/** Adapts existing server codes without replacing the Axios error or response. */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isCancel(error)) return { kind: 'CANCELLED', message: 'Operação cancelada.' };
  if (!axios.isAxiosError(error))
    return { kind: 'UNKNOWN', message: 'Não foi possível concluir a operação.' };
  const parsed = apiErrorSchema.safeParse(error.response?.data);
  const details = parsed.success ? parsed.data.error : undefined;
  const code = details?.code;
  const status = error.response?.status;
  let kind: ErrorKind;
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    code === 'TIMEOUT' ||
    code === 'UNKNOWN_ORDER_RESULT'
  )
    kind = 'TIMEOUT';
  else if (code === 'EDITION_UNAVAILABLE' || code === 'OUT_OF_STOCK') kind = 'OUT_OF_STOCK';
  else if (code === 'QUOTE_STALE' || code === 'QUOTE_CHANGED') kind = 'QUOTE_CHANGED';
  else if (status === 400 || status === 422) kind = 'VALIDATION';
  else if (status === 401) kind = 'UNAUTHORIZED';
  else if (status === 403) kind = 'FORBIDDEN';
  else if (status === 404) kind = 'NOT_FOUND';
  else if (status === 409) kind = 'CONFLICT';
  else if (status && status >= 500) kind = 'TRANSIENT_ERROR';
  else if (!error.response) kind = 'NETWORK_ERROR';
  else kind = 'UNKNOWN';
  return {
    kind,
    code,
    status,
    message: details?.message ?? 'Não foi possível concluir a operação.',
    fieldErrors: details?.fieldErrors,
  };
}
