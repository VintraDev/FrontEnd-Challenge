import {
  cartLineInputSchema,
  cartQuantityInputSchema,
  cartSchema,
  couponInputSchema,
  guestQuoteRequestSchema,
  quoteSchema,
} from '@/contracts/cart';
import { http } from '@/lib/http';
export async function getCart(signal?: AbortSignal) {
  return cartSchema.parse((await http.get<unknown>('/cart', { signal })).data);
}
export async function addItem(input: { nftId: string; editionId: string; quantity: number }) {
  return cartSchema.parse(
    (await http.post<unknown>('/cart/items', cartLineInputSchema.parse(input))).data,
  );
}
export async function updateItem(input: { id: string; quantity: number }) {
  return cartSchema.parse(
    (
      await http.patch<unknown>(
        `/cart/items/${encodeURIComponent(input.id)}`,
        cartQuantityInputSchema.parse({ quantity: input.quantity }),
      )
    ).data,
  );
}
export async function removeItem(id: string) {
  return cartSchema.parse(
    (await http.delete<unknown>(`/cart/items/${encodeURIComponent(id)}`)).data,
  );
}
export async function applyCoupon(code: string) {
  return cartSchema.parse(
    (await http.post<unknown>('/cart/coupon', couponInputSchema.parse({ code }))).data,
  );
}
export async function removeCoupon() {
  return cartSchema.parse((await http.delete<unknown>('/cart/coupon')).data);
}
export async function getQuote(cartVersion: number, signal: AbortSignal) {
  return quoteSchema.parse(
    (
      await http.post<unknown>('/quotes', guestQuoteRequestSchema.parse({ cartVersion }), {
        signal,
      })
    ).data,
  );
}
