import { createFileRoute } from '@tanstack/react-router';
import { OrderPage } from '@/features/orders/order-page';
import { OwnedOrderPage } from '@/features/orders/owned-order-page';
export const Route = createFileRoute('/orders/$orderId')({ component: Page });
function Page() {
  const { orderId } = Route.useParams();
  return orderId === 'preview' ? (
    <OrderPage orderId={orderId} />
  ) : (
    <OwnedOrderPage orderId={orderId} />
  );
}
