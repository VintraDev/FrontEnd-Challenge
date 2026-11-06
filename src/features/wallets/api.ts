import { walletRecordSchema, walletsSchema, type WalletInput } from '@/contracts/wallets';
import { http } from '@/lib/http';

export async function getWallets(signal?: AbortSignal) {
  return walletsSchema.parse((await http.get<unknown>('/wallets', { signal })).data);
}
export async function saveWallet(input: WalletInput, id?: string) {
  const response = id
    ? await http.patch<unknown>(`/wallets/${encodeURIComponent(id)}`, input)
    : await http.post<unknown>('/wallets', input);
  return walletRecordSchema.parse(response.data);
}
