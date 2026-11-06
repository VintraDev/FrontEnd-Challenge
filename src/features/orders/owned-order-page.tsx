import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from '@tanstack/react-router';
import axios from 'axios';
import { AlertCircle, BadgeCheck, Clock3 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/features/auth/session';
import { queryKeys } from '@/lib/query-keys';
import { getOrder } from './api';
import './order.css';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

export function OwnedOrderPage({ orderId }: { orderId: string }) {
  const session = useSession();
  if (session.isPending) return <main role="status">Verificando sessão...</main>;
  if (session.isError)
    return (
      <main role="alert">
        <p>Não foi possível verificar sua sessão.</p>
        <Button onClick={() => void session.refetch()}>Tentar novamente</Button>
      </main>
    );
  if (!session.data)
    return (
      <Navigate
        to="/login"
        search={{ redirect: `/orders/${encodeURIComponent(orderId)}` }}
        replace
      />
    );
  return <OrderContent userId={session.data.user.id} orderId={orderId} />;
}
function OrderContent({ userId, orderId }: { userId: string; orderId: string }) {
  const client = useQueryClient();
  const order = useQuery({
    queryKey: queryKeys.order(userId, orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 400 : false),
  });

  useEffect(() => {
    if (order.data?.status === 'confirmed') {
      void client.invalidateQueries({ queryKey: queryKeys.cart(userId) });
    }
  }, [client, order.data?.status, userId]);

  if (order.isPending) return <main role="status">Carregando pedido...</main>;
  if (order.isError)
    return (
      <main className="order-page">
        <Card className="order-state">
          <h1>Pedido indisponível</h1>
          <p>
            {axios.isAxiosError(order.error) && order.error.response?.status === 404
              ? 'Pedido não encontrado.'
              : 'Não foi possível carregar o pedido.'}
          </p>
          <Button variant="outline" onClick={() => void order.refetch()}>
            Tentar novamente
          </Button>
          <Link to="/cart" className={buttonVariants()}>
            Voltar ao carrinho
          </Link>
        </Card>
      </main>
    );
  const data = order.data;
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(data.createdAt));
  return (
    <main className="order-page">
      <Card className="order-card">
        <header className="order-header">
          {data.status === 'confirmed' ? (
            <BadgeCheck size={56} aria-hidden="true" />
          ) : data.status === 'pending' ? (
            <Clock3 size={56} aria-hidden="true" />
          ) : (
            <AlertCircle size={56} aria-hidden="true" />
          )}
          <h1>
            {data.status === 'confirmed'
              ? 'Pedido confirmado'
              : data.status === 'pending'
                ? 'Pedido pendente'
                : 'Pedido recusado'}
          </h1>
          <p>Dados de demonstração da conta.</p>
          {data.status === 'pending' && (
            <p role="status" className="order-status-banner">
              Processando confirmação simulada da tentativa. Não feche nem reenvie a compra.
            </p>
          )}
          {data.status === 'declined' && (
            <p role="alert" className="order-status-banner order-status-banner--declined">
              A tentativa foi recusada pela simulação. Seu carrinho foi preservado sem cobrança.
            </p>
          )}
        </header>
        {data.status === 'confirmed' && data.receipt && (
          <dl className="order-meta">
            <div>
              <dt>ID da transação</dt>
              <dd>{data.receipt.transactionRef}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{formattedDate}</dd>
            </div>
            <div>
              <dt>Rede</dt>
              <dd>{data.receipt.network}</dd>
            </div>
            <div>
              <dt>Carteira</dt>
              <dd>{data.receipt.wallet}</dd>
            </div>
          </dl>
        )}
        <section className="order-details">
          <p>ID do pedido: {data.id}</p>
          <p className="order-idempotency-key">Chave da tentativa: {data.idempotencyKey}</p>
          {data.status === 'confirmed' && data.receipt ? (
            <>
              <h2>Detalhes da transação</h2>
              <p>Transação simulada: {data.receipt.transactionRef}</p>
              <p>
                Rede: {data.receipt.network} · {data.receipt.wallet}
              </p>
              <ul className="order-items">
                {data.receipt.items.map((item) => (
                  <li key={`${item.nftId}-${item.editionId}`}>
                    <img src={item.image} alt="" />
                    <div className="order-item-name">
                      <strong>{item.title}</strong>
                      <p>
                        Quantidade: {item.quantity} · {item.unitPriceEth} ETH
                      </p>
                    </div>
                    <strong className="order-item-price">{item.subtotalEth} ETH</strong>
                  </li>
                ))}
              </ul>
              <dl className="order-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{data.receipt.subtotalEth} ETH</dd>
                </div>
                <div>
                  <dt>Desconto</dt>
                  <dd>{data.receipt.discountEth} ETH</dd>
                </div>
                <div>
                  <dt>Taxa de rede</dt>
                  <dd>{data.receipt.networkFeeEth} ETH</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{data.receipt.totalEth} ETH</dd>
                </div>
              </dl>
              <p className="order-note">
                Snapshot imutável de pedido confirmado na rede {data.receipt.network}. Nenhuma
                transação real foi enviada à blockchain.
              </p>
              <Button disabled>Ver no Etherscan</Button>
              <Link to="/" search={homeSearch} className="order-return">
                Continuar explorando
              </Link>
            </>
          ) : (
            <p>O recibo estará disponível somente após confirmação.</p>
          )}
          <div className="order-actions">
            {data.status === 'declined' && (
              <Link to="/checkout" className={buttonVariants({ variant: 'outline' })}>
                Revisar pagamento
              </Link>
            )}
            <Link to="/cart" className={buttonVariants()}>
              Voltar ao carrinho
            </Link>
          </div>
        </section>
      </Card>
    </main>
  );
}
