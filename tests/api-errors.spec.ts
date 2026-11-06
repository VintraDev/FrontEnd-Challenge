import { expect, test } from '@playwright/test';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { normalizeApiError } from '../src/lib/errors';
import { http } from '../src/lib/http';

test('adapta erros existentes sem perder o erro Axios ou o código original', async () => {
  const error = new AxiosError('Conflito', 'ERR_BAD_REQUEST', undefined, undefined, {
    data: { error: { code: 'QUOTE_STALE', message: 'Cotação mudou.' } },
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
  expect(normalizeApiError(error)).toMatchObject({
    kind: 'QUOTE_CHANGED',
    code: 'QUOTE_STALE',
    status: 409,
  });
  expect(normalizeApiError(new AxiosError('timeout', 'ECONNABORTED')).kind).toBe('TIMEOUT');
  expect(normalizeApiError(new AxiosError('rede', 'ERR_NETWORK')).kind).toBe('NETWORK_ERROR');
  expect(normalizeApiError(new axios.CanceledError()).kind).toBe('CANCELLED');
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null },
  });
  const original = http.defaults.adapter;
  http.defaults.adapter = async () => {
    throw error;
  };
  try {
    await expect(http.get('/example')).rejects.toMatchObject({
      isAxiosError: true,
      normalized: { kind: 'QUOTE_CHANGED', code: 'QUOTE_STALE' },
      response: { status: 409 },
    });
  } finally {
    http.defaults.adapter = original;
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
