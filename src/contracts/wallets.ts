import { z } from 'zod'
import { walletSchema } from './checkout'

export const walletInputSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.').max(50),
  label: z.string().trim().min(2, 'Informe o apelido da carteira.').max(50),
  network: z.enum(['Ethereum', 'Polygon'], { error: 'Selecione uma rede.' }),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.').max(50),
  address: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais.'),
  secondaryAddress: z.string().trim().max(100),
  walletType: z.enum(['MetaMask', 'WalletConnect', 'Outra'], { error: 'Selecione o tipo de carteira.' }),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.').max(50),
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  ens: z.string().trim().min(1, 'Informe o nome ENS.').max(100),
  isPrimary: z.boolean(),
}).strict()
export const walletRecordSchema = walletSchema.extend(walletInputSchema.shape)
export const walletsSchema = z.object({ items: z.array(walletRecordSchema) })
export type WalletInput = z.input<typeof walletInputSchema>
export type WalletRecord = z.infer<typeof walletRecordSchema>
