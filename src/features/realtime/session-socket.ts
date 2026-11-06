import { io } from 'socket.io-client';
import { realtimeEventSchema, type RealtimeEvent } from '@/contracts/events';

type SessionSocketOptions = {
  onRejected: () => void;
  onEvent: (event: RealtimeEvent) => void;
  onReconnect: () => void;
};

/** A session-scoped connection; REST remains the source of truth after every event. */
export function connectSessionSocket(token: string, options: SessionSocketOptions) {
  const socket = io(window.location.origin, { transports: ['websocket'], reconnection: true });
  socket.on('connect', () => {
    socket.emit('session.subscribe', { token });
    options.onReconnect();
  });
  socket.on('session.rejected', options.onRejected);
  const receive = (payload: unknown) => {
    const event = realtimeEventSchema.safeParse(payload);
    if (event.success) options.onEvent(event.data);
  };
  socket.on('nft.updated', receive);
  socket.on('order.updated', receive);
  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
