import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/catalog/nft-detail-page'
export const Route = createFileRoute('/nft/$nftId')({ component: Page })
function Page() { const { nftId } = Route.useParams(); return <NftDetailPage key={nftId} nftId={nftId} /> }
