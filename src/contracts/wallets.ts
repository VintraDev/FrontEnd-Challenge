import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './api';

export const walletNetworkSchema = z.enum(['ethereum', 'polygon', 'solana']);
export const walletConnectionStatusSchema = z.enum(['connected', 'disconnected', 'rejected']);
export const walletSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(80),
  address: z.string().trim().min(8).max(128),
  network: walletNetworkSchema,
  isPrimary: z.boolean(),
  connectionStatus: walletConnectionStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export const createWalletRequestSchema = walletSchema
  .pick({ label: true, address: true, network: true })
  .extend({
    isPrimary: z.boolean().optional(),
  });
export const updateWalletRequestSchema = createWalletRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar a carteira.',
  });

export type Wallet = z.output<typeof walletSchema>;
export type CreateWalletRequest = z.output<typeof createWalletRequestSchema>;
export type UpdateWalletRequest = z.output<typeof updateWalletRequestSchema>;

/** Existing mock wallet form DTO. It remains separate from the normalized checkout wallet above. */
export const walletInputSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  label: z.string().trim().min(2).max(80),
  network: z.enum(['Ethereum', 'Polygon']),
  profileName: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8).max(128),
  secondaryAddress: z.string().trim().max(128),
  walletType: z.enum(['MetaMask', 'WalletConnect', 'Outra']),
  referralCode: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  ens: z.string().trim().min(1).max(100),
  isPrimary: z.boolean(),
});
export const walletRecordSchema = walletInputSchema.extend({ id: idSchema, userId: idSchema });
export const walletsSchema = z.object({ items: z.array(walletRecordSchema) });

export type WalletInput = z.output<typeof walletInputSchema>;
export type WalletRecord = z.output<typeof walletRecordSchema>;
