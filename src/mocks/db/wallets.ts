import type { WalletInput, WalletRecord } from '@/contracts/wallets';

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('kurio-mock-wallets', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('wallets');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export async function readWallets(userId: string): Promise<WalletRecord[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('wallets', 'readonly');
      const request = tx.objectStore('wallets').get(userId);
      tx.oncomplete = () => resolve((request.result as WalletRecord[] | undefined) ?? []);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function saveWallet(
  userId: string,
  input: WalletInput,
  walletId?: string,
): Promise<WalletRecord> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('wallets', 'readwrite');
      const store = tx.objectStore('wallets');
      const request = store.get(userId);
      let result: WalletRecord;
      let failure: Error | undefined;
      request.onsuccess = () => {
        const wallets = (request.result as WalletRecord[] | undefined) ?? [];
        const existing = walletId ? wallets.find((item) => item.id === walletId) : undefined;
        if (walletId && !existing) {
          failure = new Error('NOT_FOUND');
          tx.abort();
          return;
        }
        if (wallets.some((item) => item.isPrimary === input.isPrimary && item.id !== walletId)) {
          failure = new Error('CONFLICT');
          tx.abort();
          return;
        }
        result = { ...input, id: existing?.id ?? crypto.randomUUID(), userId };
        store.put([...wallets.filter((item) => item.id !== result.id), result], userId);
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error);
      tx.onerror = () => reject(failure ?? tx.error);
    });
  } finally {
    db.close();
  }
}
export async function resetWallets(): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('wallets', 'readwrite');
      tx.objectStore('wallets').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
