import axios from 'axios';
import { normalizeApiError, type NormalizedApiError } from './errors';

declare module 'axios' {
  interface AxiosError {
    normalized?: NormalizedApiError;
  }
}
export const http = axios.create({ baseURL: '/api', timeout: 5000 });

export const sessionTokenKey = 'kurio-demo-session';
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(sessionTokenKey);
  if (token && !config.headers.has('Authorization'))
    config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// Keep Axios identity and server payload intact for existing consumers.
http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error)) error.normalized = normalizeApiError(error);
  return Promise.reject(error);
});
