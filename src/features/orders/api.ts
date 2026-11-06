import { receiptSchema } from '@/contracts/order';
import { orderDetailSchema } from '@/contracts/order-detail';
import { createOrderRequestSchema, type CreateOrderRequest } from '@/contracts/checkout';
import { http } from '@/lib/http';

export async function getReceiptPreview(signal?: AbortSignal) {
  const response = await http.get('/orders/preview', { signal });
  return receiptSchema.parse(response.data);
}

export async function getOrder(id: string, signal?: AbortSignal) {
  return orderDetailSchema.parse(
    (await http.get<unknown>(`/orders/${encodeURIComponent(id)}`, { signal })).data,
  );
}
export async function getOrderByKey(key: string, signal?: AbortSignal) {
  return orderDetailSchema.parse(
    (await http.get<unknown>(`/orders/by-key/${encodeURIComponent(key)}`, { signal })).data,
  );
}
export async function createOrder(input: CreateOrderRequest, idempotencyKey: string) {
  return orderDetailSchema.parse(
    (
      await http.post<unknown>('/orders', createOrderRequestSchema.parse(input), {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  );
}
