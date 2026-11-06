import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BadgeCheck, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getReceiptPreview } from './api';

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
const stateCardClass = 'grid justify-items-start gap-4 bg-surface p-8 text-foreground';
const metaItemBorderClass = 'border-l border-primary-hover pl-3';

export function OrderPage({ orderId }: { orderId: string }) {
  const isPreview = orderId === 'preview';
  const receipt = useQuery({
    queryKey: queryKeys.receiptPreview(),
    queryFn: ({ signal }) => getReceiptPreview(signal),
    enabled: isPreview,
    retry: false,
  });
  if (!isPreview)
    return (
      <main className={pageClass}>
        <Card className={stateCardClass}>
          <h1 className="text-lg font-bold">Pedido indisponível</h1>
          <p>A consulta e a confirmação de pedidos ainda não estão disponíveis.</p>
          <Link to="/cart" className={buttonVariants()}>
            Voltar ao carrinho
          </Link>
        </Card>
      </main>
    );
  return (
    <main className={pageClass}>
      <Card className="relative w-[min(100%,578px)] gap-0 rounded-none border-0 border-b-[10px] border-primary-hover bg-surface p-0 text-foreground shadow-none">
        <Link
          to="/checkout"
          className="absolute top-4 right-4 text-primary-hover"
          aria-label="Fechar prévia e voltar ao pagamento"
        >
          <X size={20} />
        </Link>
        <header className="flex flex-col items-center gap-3 border-b border-primary-hover px-6 py-8 text-center [&_svg]:text-primary-hover">
          <BadgeCheck size={64} aria-hidden="true" />
          <h1 className="text-base font-bold">Prévia da confirmação de pedido</h1>
          <p className="text-sm text-muted-foreground">
            Dados demonstrativos. Nenhuma compra foi realizada.
          </p>
        </header>
        {receipt.isPending ? (
          <div className="grid gap-4 p-8 *:h-16" aria-label="Carregando prévia">
            <Skeleton />
            <Skeleton />
          </div>
        ) : receipt.isError ? (
          <section className={stateCardClass} role="alert">
            <h2 className="text-lg font-bold">Não foi possível carregar a prévia.</h2>
            <Button onClick={() => void receipt.refetch()}>Tentar novamente</Button>
          </section>
        ) : (
          <>
            <dl className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-3 border-b border-primary-hover px-8 py-4 text-xs text-muted-foreground max-[600px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[600px]:p-4">
              <div>
                <dt className="font-bold">ID da transação</dt>
                <dd className="wrap-anywhere">{receipt.data.transactionId}</dd>
              </div>
              <div className={metaItemBorderClass}>
                <dt className="font-bold">Data</dt>
                <dd className="wrap-anywhere">{receipt.data.date}</dd>
              </div>
              <div className={`${metaItemBorderClass} max-[600px]:border-0 max-[600px]:p-0`}>
                <dt className="font-bold">Total</dt>
                <dd className="wrap-anywhere">{receipt.data.totalEth} ETH</dd>
              </div>
              <div className={metaItemBorderClass}>
                <dt className="font-bold">Carteira</dt>
                <dd className="wrap-anywhere">{receipt.data.wallet}</dd>
              </div>
            </dl>
            <section className="px-8 pt-6 pb-12 max-[600px]:px-4 max-[600px]:pt-6 max-[600px]:pb-8">
              <h2 className="mb-4 text-sm font-bold">Detalhes da transação</h2>
              <div
                className="grid grid-cols-[1fr_auto_auto] gap-8 border-b border-primary-hover pb-3 text-sm font-bold max-[600px]:grid-cols-[1fr_auto]"
                aria-hidden="true"
              >
                <span>NFTs</span>
                <span>Edições</span>
                <span className="max-[600px]:hidden">Subtotal</span>
              </div>
              <ul className="mt-3 grid gap-3">
                {receipt.data.items.map((item) => (
                  <li
                    key={item.tokenId}
                    className="grid grid-cols-[70px_minmax(0,1fr)_auto_auto] items-center gap-3 max-[600px]:grid-cols-[56px_minmax(0,1fr)_auto]"
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="size-[70px] rounded-md object-cover max-[600px]:row-span-2 max-[600px]:size-14"
                    />
                    <div className="grid gap-1 text-sm">
                      <strong>{item.title}</strong>
                      <span className="text-xs text-muted-foreground">
                        ID do token: {item.tokenId}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <span className="sr-only">Quantidade: </span>(x {item.quantity})
                    </span>
                    <strong className="text-base whitespace-nowrap text-primary max-[600px]:col-[2/-1]">
                      {item.subtotalEth} ETH
                    </strong>
                  </li>
                ))}
              </ul>
              <dl className="my-6 grid gap-3 border-b border-primary-hover pb-4">
                <div className="flex justify-between gap-4">
                  <dt>Taxa de rede</dt>
                  <dd>{receipt.data.networkFeeEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-4 font-bold">
                  <dt>Total</dt>
                  <dd className="text-primary">{receipt.data.totalEth} ETH</dd>
                </div>
              </dl>
              <p className="mb-6 text-center text-sm leading-(--line-height-body) text-muted-foreground">
                Exemplo de transação na rede {receipt.data.network}. A confirmação e a transferência
                de propriedade ainda não estão disponíveis.
              </p>
              <Button disabled className="mx-auto flex">
                Ver no Etherscan
              </Button>
              <Link to="/" search={homeSearch} className="mt-4 block text-center text-primary">
                Continuar explorando
              </Link>
            </section>
          </>
        )}
      </Card>
    </main>
  );
}
