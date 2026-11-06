export interface CartLineRecord {
  id: string;
  nftId: string;
  editionId: string;
  quantity: number;
}
export interface CartRecord {
  version: number;
  lines: CartLineRecord[];
  coupon: string | null;
  debitedOrderIds?: string[];
}
const initial = (): CartRecord => ({ version: 0, lines: [], coupon: null });
let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('kurio-mock-store', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('cart');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
  });
  return database;
}
export async function readCart(scope = 'guest'): Promise<CartRecord> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readonly');
    const request = tx.objectStore('cart').get(scope);
    tx.oncomplete = () => resolve((request.result as CartRecord | undefined) ?? initial());
    tx.onerror = () => reject(tx.error);
  });
}
export async function changeCart(
  change: (cart: CartRecord) => CartRecord,
  scope = 'guest',
): Promise<CartRecord> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');
    const request = store.get(scope);
    let updated: CartRecord;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        updated = change((request.result as CartRecord | undefined) ?? initial());
        store.put(updated, scope);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(updated);
    tx.onabort = () => reject(failure ?? tx.error);
    tx.onerror = () => reject(failure ?? tx.error);
  });
}

export async function resetCarts(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    tx.objectStore('cart').clear();
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

// Guest removal and account update share one IndexedDB transaction.
export async function mergeGuestCart(
  userId: string,
  merge: (account: CartRecord, guest: CartRecord) => CartRecord,
): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');
    const guest = store.get('guest');
    const account = store.get(`user:${userId}`);
    let failure: unknown;
    account.onsuccess = () => {
      try {
        const visitor = (guest.result as CartRecord | undefined) ?? initial();
        if (!visitor.lines.length && !visitor.coupon) return;
        const updated = merge((account.result as CartRecord | undefined) ?? initial(), visitor);
        store.put(updated, `user:${userId}`);
        store.delete('guest');
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure ?? tx.error);
    tx.onerror = () => reject(failure ?? tx.error);
  });
}
