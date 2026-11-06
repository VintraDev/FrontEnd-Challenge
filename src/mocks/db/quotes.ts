import type { Quote } from '@/contracts/cart';

export type QuoteRecord = Quote & {
  ownerId: string;
  receiptItems: Array<{
    nftId: string;
    editionId: string;
    title: string;
    image: string;
    quantity: number;
    unitPriceEth: string;
  }>;
};

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('kurio-mock-quotes', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('quotes', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export async function saveQuote(quote: QuoteRecord) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('quotes', 'readwrite');
      tx.objectStore('quotes').put(quote);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function readQuote(id: string) {
  const db = await open();
  try {
    return await new Promise<QuoteRecord | undefined>((resolve, reject) => {
      const tx = db.transaction('quotes', 'readonly');
      const request = tx.objectStore('quotes').get(id);
      tx.oncomplete = () => resolve(request.result as QuoteRecord | undefined);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function resetQuotes() {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('quotes', 'readwrite');
      tx.objectStore('quotes').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
