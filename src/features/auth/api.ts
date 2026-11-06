import axios from 'axios';
import { loginResponseSchema, sessionSchema, type Registration } from '@/contracts/auth';
import { http, sessionTokenKey } from '@/lib/http';

export async function login(input: { email: string; password: string }) {
  const result = loginResponseSchema.parse((await http.post<unknown>('/auth/login', input)).data);
  localStorage.setItem(sessionTokenKey, result.token);
  return { user: result.user, expiresAt: result.expiresAt };
}
export async function getSession(signal?: AbortSignal) {
  if (!localStorage.getItem(sessionTokenKey)) return null;
  try {
    return sessionSchema.parse((await http.get<unknown>('/auth/session', { signal })).data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(sessionTokenKey);
      return null;
    }
    throw error;
  }
}
export async function logout() {
  await http.post('/auth/logout');
  localStorage.removeItem(sessionTokenKey);
}

export async function register(input: Registration) {
  const result = loginResponseSchema.parse(
    (await http.post<unknown>('/auth/register', input)).data,
  );
  localStorage.setItem(sessionTokenKey, result.token);
  return { user: result.user, expiresAt: result.expiresAt };
}
