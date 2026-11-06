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
const secretKeyPattern = /^(?:0x)?[0-9a-fA-F]{64}$/;
const seedPhrasePattern = /^(?:\S+\s+){11,}\S+$/;
export function isForbiddenWalletSecret(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return (
    secretKeyPattern.test(normalized) ||
    seedPhrasePattern.test(normalized) ||
    /\b(?:private\s*key|seed\s*phrase|mnemonic|chave\s*privada|frase\s*de\s*recupera[cç][aã]o)\b/i.test(
      normalized,
    )
  );
}
const secretMessage =
  'Use apenas endereços públicos fictícios. Nunca informe chaves privadas ou frases de recuperação.';

export const walletProviderSchema = z.enum([
  'MetaMask',
  'WalletConnect',
  'Coinbase Wallet',
  'Outra',
]);
export const walletSupportedNetworkSchema = z.enum(['Ethereum', 'Polygon']);

export const walletInputSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  label: z.string().trim().min(2).max(80),
  network: walletSupportedNetworkSchema,
  profileName: z.string().trim().min(2).max(80),
  address: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .refine((value) => !isForbiddenWalletSecret(value), { message: secretMessage }),
  secondaryAddress: z
    .string()
    .trim()
    .max(128)
    .refine((value) => !isForbiddenWalletSecret(value), { message: secretMessage }),
  walletType: walletProviderSchema,
  referralCode: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  ens: z.string().trim().min(1).max(100),
  isPrimary: z.boolean(),
});
export const walletRecordSchema = walletInputSchema.extend({
  id: idSchema,
  userId: idSchema,
  connectionStatus: walletConnectionStatusSchema.default('disconnected'),
});
export const walletsSchema = z.object({ items: z.array(walletRecordSchema) });
export const walletConnectionRequestSchema = z.object({
  action: z.enum(['connect', 'reject', 'disconnect', 'reset', 'select']),
  network: walletSupportedNetworkSchema.optional(),
  walletType: walletProviderSchema.optional(),
});

export type WalletProvider = z.output<typeof walletProviderSchema>;
export type WalletSupportedNetwork = z.output<typeof walletSupportedNetworkSchema>;
export type WalletInput = z.output<typeof walletInputSchema>;
export type WalletRecord = z.output<typeof walletRecordSchema>;
export type WalletConnectionRequest = z.output<typeof walletConnectionRequestSchema>;
