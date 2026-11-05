import { healthSchema } from '@/contracts/diagnostics'
import { http } from '@/lib/http'
export async function getHealth(signal: AbortSignal) {
  const response = await http.get<unknown>('/health', { signal })
  return healthSchema.parse(response.data)
}
