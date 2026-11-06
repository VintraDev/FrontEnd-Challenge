import axios from 'axios';
import { loginResponseSchema, sessionSchema, type Registration } from '@/contracts/auth';
import { http, sessionTokenKey } from '@/lib/http';

async function mergeVisitorCart(userId: string, token: string) {
  try {
    await http.post('/cart/merge', undefined, { headers: { Authorization: `Bearer ${token}` } });
    sessionStorage.removeItem(`kurio-cart-merge-warning:${userId}`);
  } catch {
    // The mock keeps both carts untouched when the merge cannot be committed.
    sessionStorage.setItem(`kurio-cart-merge-warning:${userId}`, '1');
  }
}

export async function login(input: { email: string; password: string }) {
  const result = loginResponseSchema.parse((await http.post<unknown>('/auth/login', input)).data);
  localStorage.setItem(sessionTokenKey, result.token);
  await mergeVisitorCart(result.user.id, result.token);
  if (localStorage.getItem(sessionTokenKey) !== result.token)
    throw new axios.CanceledError('Sessão substituída.');
  return { user: result.user, expiresAt: result.expiresAt };
}
export async function getSession(signal?: AbortSignal) {
  const token = localStorage.getItem(sessionTokenKey);
  if (!token) return null;
  try {
    const result = sessionSchema.parse(
      (
        await http.get<unknown>('/auth/session', {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        })
      ).data,
    );
    if (localStorage.getItem(sessionTokenKey) !== token)
      throw new axios.CanceledError('Sessão substituída.');
    return result;
  } catch (error) {
    const currentToken = localStorage.getItem(sessionTokenKey);
    if (currentToken && currentToken !== token)
      throw new axios.CanceledError('Sessão substituída.');
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (currentToken === token) localStorage.removeItem(sessionTokenKey);
      return null;
    }
    throw error;
  }
}
export async function logout() {
  const token = localStorage.getItem(sessionTokenKey);
  if (!token) return false;
  await http.post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });
  if (localStorage.getItem(sessionTokenKey) !== token) return false;
  localStorage.removeItem(sessionTokenKey);
  return true;
}

export async function register(input: Registration) {
  const result = loginResponseSchema.parse(
    (await http.post<unknown>('/auth/register', input)).data,
  );
  localStorage.setItem(sessionTokenKey, result.token);
  await mergeVisitorCart(result.user.id, result.token);
  if (localStorage.getItem(sessionTokenKey) !== result.token)
    throw new axios.CanceledError('Sessão substituída.');
  return { user: result.user, expiresAt: result.expiresAt };
}
