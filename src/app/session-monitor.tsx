import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/session';
import { sessionTokenKey } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import { expireSession, syncExternalSession } from './session-lifecycle';

const MAX_DELAY = 2_147_483_647;

export function SessionMonitor() {
  const client = useQueryClient();
  const { data } = useSession();
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === localStorage &&
        (event.key === sessionTokenKey || event.key === null)
      ) {
        syncExternalSession(client);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [client]);
  useEffect(() => {
    if (!data) return;
    const token = localStorage.getItem(sessionTokenKey);
    if (!token) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const remaining = data.expiresAt - Date.now();
      if (remaining <= 0) {
        expireSession(client, token);
        return;
      }
      timer = setTimeout(schedule, Math.min(remaining, MAX_DELAY));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [client, data]);
  useEffect(() => {
    if (!data) return;
    const token = localStorage.getItem(sessionTokenKey);
    if (!token) return;
    let active = true;
    let disconnect: (() => void) | undefined;
    const seenEvents = new Set<string>();
    const seenVersions = new Map<string, number>();
    void import('@/features/realtime/session-socket').then(({ connectSessionSocket }) => {
      if (active && localStorage.getItem(sessionTokenKey) === token)
        disconnect = connectSessionSocket(token, {
          onRejected: () => expireSession(client, token),
          onEvent: (event) => {
            const versions = seenVersions;
            if (
              seenEvents.has(event.eventId) ||
              (versions.get(event.resourceId) ?? -1) >= event.version
            )
              return;
            seenEvents.add(event.eventId);
            versions.set(event.resourceId, event.version);
            if (event.type === 'nft.updated') {
              void client.invalidateQueries({ queryKey: ['catalog'], refetchType: 'active' });
              void client.invalidateQueries({
                queryKey: queryKeys.nft(event.resourceId),
                refetchType: 'active',
              });
              void client.invalidateQueries({
                queryKey: queryKeys.cart(data.user.id),
                refetchType: 'active',
              });
              void client.invalidateQueries({ queryKey: ['quote'], refetchType: 'active' });
              return;
            }
            if (event.ownerScope !== data.user.id) return;
            void client.invalidateQueries({
              queryKey: queryKeys.order(data.user.id, event.resourceId),
              refetchType: 'active',
            });
          },
          onReconnect: () => {
            void client.invalidateQueries({ queryKey: ['catalog'], refetchType: 'active' });
            void client.invalidateQueries({ queryKey: ['nft'], refetchType: 'active' });
            void client.invalidateQueries({
              queryKey: queryKeys.cart(data.user.id),
              refetchType: 'active',
            });
            void client.invalidateQueries({ queryKey: ['quote'], refetchType: 'active' });
            void client.invalidateQueries({
              queryKey: queryKeys.orders(data.user.id),
              refetchType: 'active',
            });
          },
        });
    });
    return () => {
      active = false;
      disconnect?.();
    };
  }, [client, data]);
  return null;
}
