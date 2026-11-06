import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@/contracts/auth'
import type { Nft } from '@/contracts/catalog'
import type { Favorites } from '@/contracts/favorites'
import { queryKeys } from '@/lib/query-keys'
import { changeFavorite, getFavorites } from './api'

export function useFavorites(userId: string | undefined) {
  return useQuery({ queryKey: queryKeys.favorites(userId ?? ''), queryFn: ({ signal }) => getFavorites(signal), enabled: !!userId, retry: false })
}
export function useChangeFavorite(userId: string) {
  const client = useQueryClient()
  const key = queryKeys.favorites(userId)
  const isCurrent = () => client.getQueryData<Session | null>(queryKeys.session())?.user.id === userId
  return useMutation({
    mutationFn: ({ nft, add }: { nft: Nft; add: boolean }) => changeFavorite(nft.id, add),
    onMutate: async ({ nft, add }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Favorites>(key)
      if (previous && isCurrent()) client.setQueryData<Favorites>(key, { items: add ? [...previous.items.filter((item) => item.id !== nft.id), nft] : previous.items.filter((item) => item.id !== nft.id) })
      return { previous }
    },
    onError: (_error, _variables, context) => { if (context?.previous && isCurrent()) client.setQueryData(key, context.previous) },
    onSettled: async () => { if (isCurrent()) await client.invalidateQueries({ queryKey: key }) },
  })
}
