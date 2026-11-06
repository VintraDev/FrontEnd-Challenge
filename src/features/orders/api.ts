import { receiptSchema } from '@/contracts/order';
import { http } from '@/lib/http';

export async function getReceiptPreview(signal?: AbortSignal) {
  const response = await http.get('/orders/preview', { signal });
  return receiptSchema.parse(response.data);
}
