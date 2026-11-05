import { queryKeys } from '@/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getReceiptPreview } from './api'
import './order.css'

const homeSearch = { q: '', categories: '', network: '', minPrice: '', maxPrice: '', sort: 'recent' as const, page: 1 }

export function OrderPage({ orderId }: { orderId: string }) {
  const isPreview = orderId === 'preview'
  const receipt = useQuery({ queryKey: queryKeys.receiptPreview(), queryFn: ({ signal }) => getReceiptPreview(signal), enabled: isPreview, retry: false })
  if (!isPreview) return <main className="order-page"><Card className="order-state"><h1>Pedido indisponível</h1><p>A consulta e a confirmação de pedidos ainda não estão disponíveis.</p><Link to="/cart" className={buttonVariants()}>Voltar ao carrinho</Link></Card></main>
  return <main className="order-page"><Card className="order-card">
    <Link to="/checkout" className="order-close" aria-label="Fechar prévia e voltar ao pagamento"><X size={20} /></Link>
    <header className="order-header"><BadgeCheck size={64} aria-hidden="true" /><h1>Prévia da confirmação de pedido</h1><p>Dados demonstrativos. Nenhuma compra foi realizada.</p></header>
    {receipt.isPending ? <div className="order-loading" aria-label="Carregando prévia"><Skeleton /><Skeleton /></div> : receipt.isError ? <section className="order-state" role="alert"><h2>Não foi possível carregar a prévia.</h2><Button onClick={() => void receipt.refetch()}>Tentar novamente</Button></section> : <>
      <dl className="order-meta"><div><dt>ID da transação</dt><dd>{receipt.data.transactionId}</dd></div><div><dt>Data</dt><dd>{receipt.data.date}</dd></div><div><dt>Total</dt><dd>{receipt.data.totalEth} ETH</dd></div><div><dt>Carteira</dt><dd>{receipt.data.wallet}</dd></div></dl>
      <section className="order-details"><h2>Detalhes da transação</h2><div className="order-table-header" aria-hidden="true"><span>NFTs</span><span>Edições</span><span>Subtotal</span></div><ul className="order-items">{receipt.data.items.map((item) => <li key={item.tokenId}><img src={item.image} alt="" /><div className="order-item-name"><strong>{item.title}</strong><span>ID do token: {item.tokenId}</span></div><span className="order-quantity"><span className="sr-only">Quantidade: </span>(x {item.quantity})</span><strong className="order-item-price">{item.subtotalEth} ETH</strong></li>)}</ul>
        <dl className="order-totals"><div><dt>Taxa de rede</dt><dd>{receipt.data.networkFeeEth} ETH</dd></div><div><dt>Total</dt><dd>{receipt.data.totalEth} ETH</dd></div></dl>
        <p className="order-note">Exemplo de transação na rede {receipt.data.network}. A confirmação e a transferência de propriedade ainda não estão disponíveis.</p><Button disabled>Ver no Etherscan</Button><Link to="/" search={homeSearch} className="order-return">Continuar explorando</Link>
      </section>
    </>}
  </Card></main>
}
