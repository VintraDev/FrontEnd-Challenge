import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './api';

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(8).max(256);

export const sessionUserSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
});
export const authUserSchema = sessionUserSchema.extend({
  displayName: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().default(null),
});

export const loginRequestSchema = z.object({ email: emailSchema, password: passwordSchema });
export const registrationSchema = loginRequestSchema.extend({
  name: z.string().trim().min(2, 'Informe um nome com pelo menos 2 caracteres.').max(80),
});
export const registerRequestSchema = registrationSchema;

export const sessionScopeSchema = z.object({
  userId: idSchema,
  sessionEpoch: z.number().int().nonnegative(),
});

export const authenticatedSessionStateSchema = z.object({
  status: z.literal('authenticated'),
  user: authUserSchema,
  expiresAt: isoDateTimeSchema,
  scope: sessionScopeSchema,
});
export const anonymousSessionStateSchema = z.object({ status: z.literal('anonymous') });
export const sessionStateSchema = z.discriminatedUnion('status', [
  authenticatedSessionStateSchema,
  anonymousSessionStateSchema,
]);

/** Current MSW session DTO; session state adds scope and lifecycle in a future endpoint revision. */
export const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: z.number().int().positive(),
});
export const loginResponseSchema = sessionSchema.extend({
  token: z.string().trim().min(1).max(255),
});

export type AuthUser = z.output<typeof authUserSchema>;
export type LoginRequest = z.output<typeof loginRequestSchema>;
export type Registration = z.output<typeof registrationSchema>;
export type RegisterRequest = Registration;
export type SessionScope = z.output<typeof sessionScopeSchema>;
export type Session = z.output<typeof sessionSchema>;
export type SessionState = z.output<typeof sessionStateSchema>;
