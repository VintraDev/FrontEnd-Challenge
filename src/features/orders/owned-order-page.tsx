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

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const pageClass =
  'flex min-h-screen items-start justify-center px-6 py-16 max-[600px]:px-4 max-[600px]:py-6';
const metaItemBorderClass = 'border-l border-primary-hover pl-3';

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
      <main className={pageClass}>
        <Card className="grid justify-items-start gap-4 bg-surface p-8 text-foreground">
          <h1 className="text-lg font-bold">Pedido indisponível</h1>
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
    <main className={pageClass}>
      <Card className="relative w-[min(100%,578px)] gap-0 rounded-none border-0 border-b-[10px] border-primary-hover bg-surface p-0 text-foreground shadow-none">
        <header className="flex flex-col items-center gap-3 border-b border-primary-hover px-6 py-8 text-center [&_svg]:text-primary-hover">
          {data.status === 'confirmed' ? (
            <BadgeCheck size={56} aria-hidden="true" />
          ) : data.status === 'pending' ? (
            <Clock3 size={56} aria-hidden="true" />
          ) : (
            <AlertCircle size={56} aria-hidden="true" />
          )}
          <h1 className="text-base font-bold">
            {data.status === 'confirmed'
              ? 'Pedido confirmado'
              : data.status === 'pending'
                ? 'Pedido pendente'
                : 'Pedido recusado'}
          </h1>
          <p className="text-sm text-muted-foreground">Dados de demonstração da conta.</p>
          {data.status === 'pending' && (
            <p
              role="status"
              className="mt-2 rounded-sm border border-primary px-4 py-2 text-xs text-foreground"
            >
              Processando confirmação simulada da tentativa. Não feche nem reenvie a compra.
            </p>
          )}
          {data.status === 'declined' && (
            <p
              role="alert"
              className="mt-2 rounded-sm border border-destructive px-4 py-2 text-xs text-destructive"
            >
              A tentativa foi recusada pela simulação. Seu carrinho foi preservado sem cobrança.
            </p>
          )}
        </header>
        {data.status === 'confirmed' && data.receipt && (
          <dl className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-3 border-b border-primary-hover px-8 py-4 text-xs text-muted-foreground max-[600px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[600px]:p-4">
            <div>
              <dt className="font-bold">ID da transação</dt>
              <dd className="wrap-anywhere">{data.receipt.transactionRef}</dd>
            </div>
            <div className={metaItemBorderClass}>
              <dt className="font-bold">Data</dt>
              <dd className="wrap-anywhere">{formattedDate}</dd>
            </div>
            <div className={`${metaItemBorderClass} max-[600px]:border-0 max-[600px]:p-0`}>
              <dt className="font-bold">Rede</dt>
              <dd className="wrap-anywhere">{data.receipt.network}</dd>
            </div>
            <div className={metaItemBorderClass}>
              <dt className="font-bold">Carteira</dt>
              <dd className="wrap-anywhere">{data.receipt.wallet}</dd>
            </div>
          </dl>
        )}
        <section className="px-8 pt-6 pb-12 max-[600px]:px-4 max-[600px]:pt-6 max-[600px]:pb-8">
          <p>ID do pedido: {data.id}</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Chave da tentativa: {data.idempotencyKey}
          </p>
          {data.status === 'confirmed' && data.receipt ? (
            <>
              <h2 className="mb-4 text-sm font-bold">Detalhes da transação</h2>
              <p>Transação simulada: {data.receipt.transactionRef}</p>
              <p>
                Rede: {data.receipt.network} · {data.receipt.wallet}
              </p>
              <ul className="mt-3 grid gap-3">
                {data.receipt.items.map((item) => (
                  <li
                    key={`${item.nftId}-${item.editionId}`}
                    className="grid grid-cols-[70px_minmax(0,1fr)_auto_auto] items-center gap-3 max-[600px]:grid-cols-[56px_minmax(0,1fr)_auto]"
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="size-[70px] rounded-md object-cover max-[600px]:row-span-2 max-[600px]:size-14"
                    />
                    <div className="grid gap-1 text-sm">
                      <strong>{item.title}</strong>
                      <p>
                        Quantidade: {item.quantity} · {item.unitPriceEth} ETH
                      </p>
                    </div>
                    <strong className="text-base whitespace-nowrap text-primary max-[600px]:col-[2/-1]">
                      {item.subtotalEth} ETH
                    </strong>
                  </li>
                ))}
              </ul>
              <dl className="my-6 grid gap-3 border-b border-primary-hover pb-4">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>{data.receipt.subtotalEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Desconto</dt>
                  <dd>{data.receipt.discountEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Taxa de rede</dt>
                  <dd>{data.receipt.networkFeeEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-4 font-bold">
                  <dt>Total</dt>
                  <dd className="text-primary">{data.receipt.totalEth} ETH</dd>
                </div>
              </dl>
              <p className="mb-6 text-center text-sm leading-(--line-height-body) text-muted-foreground">
                Snapshot imutável de pedido confirmado na rede {data.receipt.network}. Nenhuma
                transação real foi enviada à blockchain.
              </p>
              <Button disabled className="mx-auto flex">
                Ver no Etherscan
              </Button>
              <Link to="/" search={homeSearch} className="mt-4 block text-center text-primary">
                Continuar explorando
              </Link>
            </>
          ) : (
            <p>O recibo estará disponível somente após confirmação.</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
