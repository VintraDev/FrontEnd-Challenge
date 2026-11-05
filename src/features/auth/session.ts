import { queryKeys } from '@/lib/query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession, logout } from './api'

export function useSession() { return useQuery({ queryKey: queryKeys.session(), queryFn: ({ signal }) => getSession(signal), retry: false, refetchOnWindowFocus: true }) }
export function useLogout() {
  const client = useQueryClient()
  return useMutation({ mutationFn: logout, onSuccess: async () => {
    await client.cancelQueries()
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
    client.setQueryData(queryKeys.session(), null)
  } })
}
