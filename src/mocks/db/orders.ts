import type { OrderDetail } from '@/contracts/order-detail';
import { orderFixtures } from '../fixtures/orders';

export type StoredOrder = OrderDetail & {
  attemptHash?: string;
  walletSnapshot?: string;
  settleAt?: number;
  settleStatus?: 'confirmed' | 'declined';
  receiptItems?: Array<{
    nftId: string;
    editionId: string;
    title: string;
    image: string;
    quantity: number;
    unitPriceEth: string;
    subtotalEth: string;
  }>;
};
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('kurio-mock-orders', 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('orders')) {
        const store = request.result.createObjectStore('orders', { keyPath: 'id' });
        for (const order of orderFixtures) store.put(order);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
async function all(db: IDBDatabase): Promise<StoredOrder[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('orders', 'readonly');
    const request = tx.objectStore('orders').getAll();
    tx.oncomplete = () => resolve(request.result as StoredOrder[]);
    tx.onerror = () => reject(tx.error);
  });
}
export async function readOrders(userId: string) {
  const db = await open();
  try {
    return (await all(db)).filter((item) => item.userId === userId);
  } finally {
    db.close();
  }
}
export async function findAttempt(userId: string, idempotencyKey: string) {
  const db = await open();
  try {
    return (await all(db)).find(
      (item) => item.userId === userId && item.idempotencyKey === idempotencyKey,
    );
  } finally {
    db.close();
  }
}
export async function createAttempt(order: StoredOrder, attemptHash: string) {
  const db = await open();
  try {
    return await new Promise<{ order: StoredOrder; created: boolean; conflict: boolean }>(
      (resolve, reject) => {
        const tx = db.transaction('orders', 'readwrite');
        const store = tx.objectStore('orders');
        const request = store.getAll();
        let outcome: { order: StoredOrder; created: boolean; conflict: boolean };
        request.onsuccess = () => {
          const match = (request.result as StoredOrder[]).find(
            (item) => item.userId === order.userId && item.idempotencyKey === order.idempotencyKey,
          );
          if (match) {
            outcome = {
              order: match,
              created: false,
              conflict: match.attemptHash !== attemptHash,
            };
            return;
          }
          const createdOrder: StoredOrder = { ...order, attemptHash };
          store.put(createdOrder);
          outcome = { order: createdOrder, created: true, conflict: false };
        };
        tx.oncomplete = () => resolve(outcome);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      },
    );
  } finally {
    db.close();
  }
}
export async function settleOrderInStore(orderId: string, userId: string, now = Date.now()) {
  const db = await open();
  try {
    return await new Promise<{ order: StoredOrder; justConfirmed: boolean } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction('orders', 'readwrite');
        const store = tx.objectStore('orders');
        const request = store.get(orderId);
        let outcome: { order: StoredOrder; justConfirmed: boolean } | undefined;
        request.onsuccess = () => {
          const current = request.result as StoredOrder | undefined;
          if (!current || current.userId !== userId) {
            outcome = undefined;
            return;
          }
          // Confirmed and declined are strictly terminal states.
          if (current.status !== 'pending' || !current.settleAt || current.settleAt > now) {
            outcome = { order: current, justConfirmed: false };
            return;
          }
          if (current.settleStatus === 'declined') {
            const next: StoredOrder = {
              ...current,
              status: 'declined',
              version: current.version + 1,
              transactionRef: null,
              receipt: null,
              settleAt: undefined,
            };
            store.put(next);
            outcome = { order: next, justConfirmed: false };
            return;
          }
          const receipt = {
            orderId: current.id,
            transactionRef: `simulated-${current.id}`,
            network: current.quoteSnapshot.network,
            wallet: current.walletSnapshot ?? current.quoteSnapshot.network,
            items: current.receiptItems ?? [],
            subtotalEth: current.quoteSnapshot.subtotalEth,
            discountEth: current.quoteSnapshot.discountEth,
            networkFeeEth: current.quoteSnapshot.networkFeeEth,
            totalEth: current.quoteSnapshot.totalEth,
          };
          const next: StoredOrder = {
            ...current,
            status: 'confirmed',
            version: current.version + 1,
            transactionRef: receipt.transactionRef,
            receipt,
            settleAt: undefined,
          };
          store.put(next);
          outcome = { order: next, justConfirmed: true };
        };
        tx.oncomplete = () => resolve(outcome);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      },
    );
  } finally {
    db.close();
  }
}
export async function declinePendingOrder(orderId: string, userId: string, version: number) {
  const db = await open();
  try {
    return await new Promise<StoredOrder | undefined>((resolve, reject) => {
      const tx = db.transaction('orders', 'readwrite');
      const store = tx.objectStore('orders');
      const request = store.get(orderId);
      let outcome: StoredOrder | undefined;
      request.onsuccess = () => {
        const current = request.result as StoredOrder | undefined;
        if (!current || current.userId !== userId) return;
        if (current.status === 'pending') {
          outcome = {
            ...current,
            status: 'declined',
            version,
            transactionRef: null,
            receipt: null,
            settleAt: undefined,
          };
          store.put(outcome);
          return;
        }
        outcome = current;
      };
      tx.oncomplete = () => resolve(outcome);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function resetOrders() {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('orders', 'readwrite');
      const store = tx.objectStore('orders');
      store.clear();
      for (const order of orderFixtures) store.put(order);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
