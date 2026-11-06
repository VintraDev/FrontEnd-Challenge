import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSession, logout } from './api';
import { sessionTokenKey } from '@/lib/http';

export function safeRedirect(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    Array.from(value).some((char) => char.charCodeAt(0) <= 0x1f)
  ) {
    return '/';
  }
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && !['/login', '/register'].includes(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : '/';
  } catch {
    return '/';
  }
}

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: ({ signal }) => getSession(signal),
    retry: false,
    refetchOnWindowFocus: true,
  });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: async (ended) => {
      if (!ended) return;
      await client.cancelQueries();
      if (localStorage.getItem(sessionTokenKey)) return;
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      client.setQueryData(queryKeys.session(), null);
    },
  });
}
