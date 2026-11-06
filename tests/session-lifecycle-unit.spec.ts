import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import { expireSession } from '../src/app/session-lifecycle';
import { sessionTokenKey } from '../src/lib/http';
import { queryKeys } from '../src/lib/query-keys';

test('resposta de sessão anterior não encerra usuário atual nem apaga seu cache', () => {
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
    expect(client.getQueryData(queryKeys.profile('collector-b'))).toEqual({ displayName: 'Bruno' });
    expect(values.get(sessionTokenKey)).toBe('token-b');
    expect(expireSession(client, 'token-b')).toBe(true);
    expect(client.getQueryData(queryKeys.session())).toBeNull();
    expect(client.getQueryData(queryKeys.profile('collector-b'))).toBeUndefined();
    expect(client.getQueryData(queryKeys.cart('guest'))).toEqual({ lines: ['guest'] });
    expect(values.has(sessionTokenKey)).toBe(false);
    client.clear();
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
