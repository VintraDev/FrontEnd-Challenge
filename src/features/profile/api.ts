import { profileSchema, type ProfileInput } from '@/contracts/profile'
import { http } from '@/lib/http'
export async function getProfile(signal?: AbortSignal) { return profileSchema.parse((await http.get<unknown>('/profile', { signal })).data) }
export async function updateProfile(input: ProfileInput) { return profileSchema.parse((await http.patch<unknown>('/profile', input)).data) }
export async function changePassword(input: { currentPassword: string; newPassword: string }) { await http.post('/profile/password', input) }
