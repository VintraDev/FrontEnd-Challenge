const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('kurio-mock-favorites', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('favorites')
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

export async function readFavorites(userId: string): Promise<string[]> {
  const db = await open()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('favorites', 'readonly')
      const request = tx.objectStore('favorites').get(userId)
      tx.oncomplete = () => resolve((request.result as string[] | undefined) ?? [])
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally { db.close() }
}

export async function changeFavorites(userId: string, nftId: string, add: boolean): Promise<void> {
  const db = await open()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('favorites', 'readwrite')
      const store = tx.objectStore('favorites')
      const request = store.get(userId)
      request.onsuccess = () => {
        const previous = (request.result as string[] | undefined) ?? []
        store.put(add ? [...new Set([...previous, nftId])] : previous.filter((id) => id !== nftId), userId)
      }
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally { db.close() }
}

export async function resetFavorites(): Promise<void> {
  const db = await open()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('favorites', 'readwrite')
      tx.objectStore('favorites').clear()
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally { db.close() }
}
