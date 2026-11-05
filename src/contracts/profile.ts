import { z } from 'zod'

const avatarSchema = z.string().max(700000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/).nullable()
export const profileInputSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(50),
  username: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(50),
  ens: z.string().trim().max(100),
  walletNickname: z.string().trim().max(100),
  avatar: avatarSchema,
}).strict()
export const profileSchema = profileInputSchema.extend({ email: z.email() })
export const passwordInputSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) }).strict()
export type Profile = z.infer<typeof profileSchema>
export type ProfileInput = z.input<typeof profileInputSchema>
