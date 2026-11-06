import { createFileRoute } from '@tanstack/react-router';
import { OrderPage } from '@/features/orders/order-page';
export const Route = createFileRoute('/orders/$orderId')({ component: Page });
function Page() {
  const { orderId } = Route.useParams();
  return <OrderPage orderId={orderId} />;
}
