import { queryKeys } from '@/lib/query-keys';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { getHealth } from './api';

type SocketStatus = 'conectando' | 'conectado' | 'desconectado' | 'erro';
export function Diagnostics() {
  const health = useQuery({
    queryKey: queryKeys.health(),
    queryFn: ({ signal }) => getHealth(signal),
    retry: false,
  });
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('conectando');
  const [events, setEvents] = useState<string[]>([]);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const socket = io(window.location.origin, { transports: ['websocket'], reconnection: true });
    socket.on('connect', () => {
      setSocketStatus('conectado');
      socket.emit('probe');
    });
    socket.on('disconnect', () => setSocketStatus('desconectado'));
    socket.on('connect_error', () => setSocketStatus('erro'));
    socket.on('nft.updated', () => setEvents((previous) => [...previous, 'nft.updated']));
    socket.on('order.updated', () => setEvents((previous) => [...previous, 'order.updated']));
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [generation]);
  return (
    <section
      className="rounded-lg border border-border bg-surface p-6"
      aria-label="Diagnóstico de rede"
    >
      <h2 className="text-lg font-semibold">Diagnóstico da fundação</h2>
      <p role="status" className="mt-3">
        REST:{' '}
        {health.isPending
          ? 'carregando'
          : health.isError
            ? 'erro'
            : `${health.data.status} (${health.data.source})`}
      </p>
      <p role="status">Socket.IO: {socketStatus}</p>
      <p>
        Eventos recebidos:{' '}
        <span data-testid="events">{events.length ? events.join(', ') : 'nenhum'}</span>
      </p>
      <Button
        className="mt-4"
        variant="outline"
        onClick={() => {
          setEvents([]);
          setSocketStatus('conectando');
          setGeneration((value) => value + 1);
        }}
      >
        Reconectar teste
      </Button>
    </section>
  );
}
