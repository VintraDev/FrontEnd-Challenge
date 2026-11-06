import { http, HttpResponse } from 'msw'
import { favoriteInputSchema } from '@/contracts/favorites'
import { sessionFrom } from './auth-handlers'
import { changeFavorites, readFavorites } from './db/favorites'
import { catalogSnapshot, readScenario } from './scenarios/catalog'

const unauthorized = () => HttpResponse.json({ error: { code: 'SESSION_EXPIRED', message: 'Entre para acessar seus favoritos.' } }, { status: 401 })
const failure = () => HttpResponse.json({ error: { code: 'STORE_ERROR', message: 'Não foi possível atualizar os favoritos.' } }, { status: 500 })
const list = async (userId: string) => {
  const ids = new Set(await readFavorites(userId))
  return { items: catalogSnapshot().filter((nft) => ids.has(nft.id)) }
}
export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    try { const session = await sessionFrom(request); return session ? HttpResponse.json(await list(session.user.id)) : unauthorized() } catch { return failure() }
  }),
  http.post('/api/favorites', async ({ request }) => {
    try {
      const session = await sessionFrom(request)
      if (!session) return unauthorized()
      const input = favoriteInputSchema.safeParse(await request.json())
      if (!input.success) return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'NFT inválido.' } }, { status: 422 })
      if (!catalogSnapshot().some((nft) => nft.id === input.data.nftId)) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'NFT não encontrado.' } }, { status: 404 })
      if (readScenario().favorites === 'http-500') return failure()
      await changeFavorites(session.user.id, input.data.nftId, true)
      return HttpResponse.json(await list(session.user.id))
    } catch { return failure() }
  }),
  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    try {
      const session = await sessionFrom(request)
      if (!session) return unauthorized()
      if (readScenario().favorites === 'http-500') return failure()
      await changeFavorites(session.user.id, String(params.nftId), false)
      return HttpResponse.json(await list(session.user.id))
    } catch { return failure() }
  }),
]
