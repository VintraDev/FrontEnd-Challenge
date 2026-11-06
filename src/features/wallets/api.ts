import {
  walletRecordSchema,
  walletsSchema,
  type WalletConnectionRequest,
  type WalletInput,
} from '@/contracts/wallets';
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
export async function deleteWallet(id: string) {
  await http.delete(`/wallets/${encodeURIComponent(id)}`);
}
export async function updateWalletConnection(id: string, input: WalletConnectionRequest) {
  const response = await http.post<unknown>(`/wallets/${encodeURIComponent(id)}/connection`, input);
  return walletRecordSchema.parse(response.data);
}
