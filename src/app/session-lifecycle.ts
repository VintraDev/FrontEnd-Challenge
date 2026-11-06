import type { Query, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { http, sessionTokenKey } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';

function isPrivate(query: Query): boolean {
  const key = query.queryKey;
  return key[0] === 'user' || ((key[0] === 'cart' || key[0] === 'quote') && key[1] === 'user');
}

/** Only the session that issued the failed request can end itself. */
export function expireSession(client: QueryClient, token: string): boolean {
  if (!token || localStorage.getItem(sessionTokenKey) !== token) return false;
  localStorage.removeItem(sessionTokenKey);
  void client.cancelQueries({
    predicate: (query) => isPrivate(query) || query.queryKey[0] === 'session',
  });
  client.removeQueries({ predicate: isPrivate });
  client.setQueryData(queryKeys.session(), null);
  return true;
}

/** Reconcile another tab's login, account switch, or logout without retaining private data. */
export function syncExternalSession(client: QueryClient): void {
  void client.cancelQueries({
    predicate: (query) => isPrivate(query) || query.queryKey[0] === 'session',
  });
  client.removeQueries({ predicate: isPrivate });
  client.setQueryData(queryKeys.session(), null);
  if (localStorage.getItem(sessionTokenKey)) {
    void client.invalidateQueries({ queryKey: queryKeys.session() });
  }
}

export function installSessionLifecycle(client: QueryClient): void {
  http.interceptors.response.use(undefined, (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      (error.response.data?.error?.code === 'SESSION_EXPIRED' ||
        error.config?.url === '/auth/session')
    ) {
      const authorization = error.config?.headers.get('Authorization');
      const token =
        typeof authorization === 'string' ? authorization.match(/^Bearer (.+)$/)?.[1] : undefined;
      if (token) expireSession(client, token);
    }
    return Promise.reject(error);
  });
}
