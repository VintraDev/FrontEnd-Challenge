import { z } from 'zod';
import { emailSchema } from './auth';
import { idSchema, isoDateTimeSchema } from './api';

export const profileImageMimeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);
export const profileImageFileMetadataSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: profileImageMimeSchema,
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});
export const profileImageOptimizationSchema = z.object({
  maxDimension: z.number().int().min(128).max(4096).default(512),
  quality: z.number().min(0.5).max(1).default(0.82),
  targetType: z.literal('image/webp').default('image/webp'),
});

export const avatarDataUrlSchema = z
  .string()
  .regex(/^data:image\/(?:jpeg|png|webp);base64,/, 'Avatar inválido.');
export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  username: z.string().trim().min(1).max(80),
  email: emailSchema,
  ens: z.string().trim().max(100),
  walletNickname: z.string().trim().max(100),
  avatar: avatarDataUrlSchema.nullable(),
});
export const profileInputSchema = profileSchema.omit({ email: true });
export const profileRecordSchema = profileSchema.extend({
  id: idSchema,
  updatedAt: isoDateTimeSchema,
});
export const profileUpdateSchema = profileInputSchema;
export const profileEmailUpdateSchema = z.object({ email: emailSchema });
export const passwordInputSchema = z
  .object({
    currentPassword: z.string().min(8).max(256),
    newPassword: z.string().min(8).max(256),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'A nova senha precisa ser diferente da senha atual.',
    path: ['newPassword'],
  });
export const changePasswordRequestSchema = passwordInputSchema;

export type Profile = z.output<typeof profileSchema>;
export type ProfileInput = z.output<typeof profileInputSchema>;
export type ProfileUpdate = ProfileInput;
export type ProfileEmailUpdate = z.output<typeof profileEmailUpdateSchema>;
export type ProfileImageFileMetadata = z.output<typeof profileImageFileMetadataSchema>;
export type ProfileImageOptimization = z.output<typeof profileImageOptimizationSchema>;
