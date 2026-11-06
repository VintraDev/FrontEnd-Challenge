import { QueryClient } from '@tanstack/react-query';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { expireSession } from '@/app/session-lifecycle';
import { normalizeApiError } from '@/lib/errors';
import { http, sessionTokenKey } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';

describe('lib & session lifecycle', () => {
  it('normaliza query keys e filtros de catálogo', () => {
    expect(
      queryKeys.catalog({
        q: '  ape ',
        categories: 'Fotografia,Arte digital',
        network: 'Ethereum',
        minPrice: '1.2300',
        maxPrice: '',
        sort: 'recent',
        page: 1,
      })[1],
    ).toMatchObject({
      q: 'ape',
      categories: 'Fotografia,Arte digital',
      minPrice: '1.23',
    });
    expect(queryKeys.quote('user-1', 2, { walletId: 'w-1', network: 'Polygon' })).toEqual([
      'quote',
      'user',
      'user-1',
      2,
      'w-1',
      'Polygon',
    ]);
  });

  it('normaliza erros Axios preservando resposta e código original', async () => {
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
    const originalAdapter = http.defaults.adapter;
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
      http.defaults.adapter = originalAdapter;
      if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('expira apenas a sessão correspondente ao token informado', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const values = new Map<string, string>([[sessionTokenKey, 'token-b']]);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
      },
    });
    try {
      const client = new QueryClient();
      const b = {
        user: { id: 'collector-b', name: 'Bruno', email: 'bruno@kurio.test' },
        expiresAt: Date.now() + 10000,
      };
      client.setQueryData(queryKeys.session(), b);
      client.setQueryData(queryKeys.profile('collector-b'), { displayName: 'Bruno' });
      client.setQueryData(queryKeys.cart('guest'), { lines: ['guest'] });
      expect(expireSession(client, 'token-a')).toBe(false);
      expect(client.getQueryData(queryKeys.session())).toEqual(b);
      expect(expireSession(client, 'token-b')).toBe(true);
      expect(client.getQueryData(queryKeys.session())).toBeNull();
      expect(client.getQueryData(queryKeys.profile('collector-b'))).toBeUndefined();
      expect(client.getQueryData(queryKeys.cart('guest'))).toEqual({ lines: ['guest'] });
      client.clear();
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});
