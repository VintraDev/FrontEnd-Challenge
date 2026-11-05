import { z } from 'zod'
export const userSchema = z.object({ id: z.string(), name: z.string(), email: z.email() })
export type User = z.infer<typeof userSchema>
export const sessionSchema = z.object({ user: userSchema, expiresAt: z.number() })
export const loginResponseSchema = sessionSchema.extend({ token: z.string().min(1) })
export type Session = z.infer<typeof sessionSchema>

export const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Informe um nome com pelo menos 2 caracteres.').max(50, 'Use no máximo 50 caracteres.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(128, 'Use no máximo 128 caracteres.'),
})
export type Registration = z.input<typeof registrationSchema>
