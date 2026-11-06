import { z } from 'zod';
import Decimal from 'decimal.js';
import { orderSchema } from './checkout';
import { receiptSnapshotSchema } from './order';

export const orderDetailSchema = orderSchema
  .extend({ receipt: receiptSnapshotSchema.nullable() })
  .superRefine((order, context) => {
    if (
      order.status === 'confirmed' &&
      (!order.transactionRef ||
        !order.receipt ||
        order.receipt.orderId !== order.id ||
        order.receipt.transactionRef !== order.transactionRef)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['receipt'],
        message: 'Pedidos confirmados exigem recibo e transação correspondentes.',
      });
    }
    if (order.receipt) {
      const receipt = order.receipt;
      const quote = order.quoteSnapshot;
      try {
        const sameItems =
          receipt.items.length === quote.items.length &&
          receipt.items.every((item, index) => {
            const original = quote.items[index];
            return (
              original.nftId === item.nftId &&
              original.editionId === item.editionId &&
              original.quantity === item.quantity &&
              new Decimal(original.unitPriceEth).eq(item.unitPriceEth) &&
              new Decimal(item.unitPriceEth).mul(item.quantity).eq(item.subtotalEth)
            );
          });
        const amountsMatch = (
          ['subtotalEth', 'discountEth', 'networkFeeEth', 'totalEth'] as const
        ).every((field) => new Decimal(receipt[field]).eq(quote[field]));
        const subtotal = receipt.items.reduce(
          (sum, item) => sum.plus(item.subtotalEth),
          new Decimal(0),
        );
        if (
          !sameItems ||
          !amountsMatch ||
          receipt.network !== quote.network ||
          !subtotal.eq(receipt.subtotalEth) ||
          !subtotal.minus(receipt.discountEth).plus(receipt.networkFeeEth).eq(receipt.totalEth)
        )
          throw new Error('Invalid snapshot');
      } catch {
        context.addIssue({
          code: 'custom',
          path: ['receipt'],
          message: 'O recibo deve corresponder ao snapshot da cotação.',
        });
      }
    }
    if (order.status !== 'confirmed' && (order.receipt !== null || order.transactionRef !== null)) {
      context.addIssue({
        code: 'custom',
        path: ['receipt'],
        message: 'Pedidos não confirmados não podem ter recibo ou transação.',
      });
    }
  });
export const orderListSchema = z.object({ items: z.array(orderDetailSchema) });
export type OrderDetail = z.output<typeof orderDetailSchema>;
