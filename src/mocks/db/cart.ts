export interface CartLineRecord { id: string; nftId: string; editionId: string; quantity: number }
export interface CartRecord { version: number; lines: CartLineRecord[]; coupon: string | null }
const initial = (): CartRecord => ({ version: 0, lines: [], coupon: null })
let database: Promise<IDBDatabase> | undefined
function openDatabase(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('kurio-mock-store', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('cart')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = undefined; reject(request.error) }
  })
  return database
}
export async function readCart(): Promise<CartRecord> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readonly')
    const request = tx.objectStore('cart').get('guest')
    tx.oncomplete = () => resolve((request.result as CartRecord | undefined) ?? initial())
    tx.onerror = () => reject(tx.error)
  })
}
export async function changeCart(change: (cart: CartRecord) => CartRecord): Promise<CartRecord> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite')
    const store = tx.objectStore('cart')
    const request = store.get('guest')
    let updated: CartRecord
    let failure: unknown
    request.onsuccess = () => {
      try { updated = change((request.result as CartRecord | undefined) ?? initial()); store.put(updated, 'guest') }
      catch (error) { failure = error; tx.abort() }
    }
    tx.oncomplete = () => resolve(updated)
    tx.onabort = () => reject(failure ?? tx.error)
    tx.onerror = () => reject(failure ?? tx.error)
  })
}
