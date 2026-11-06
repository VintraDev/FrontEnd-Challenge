import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/features/catalog/components/site-header';
import {
  walletInputSchema,
  type WalletConnectionRequest,
  type WalletInput,
  type WalletRecord,
} from '@/contracts/wallets';
import { queryKeys } from '@/lib/query-keys';
import { deleteWallet, getWallets, saveWallet, updateWalletConnection } from './api';

const blank = (isPrimary: boolean): WalletInput => ({
  displayName: '',
  label: '',
  network: '' as WalletInput['network'],
  profileName: '',
  address: '',
  secondaryAddress: '',
  walletType: '' as WalletInput['walletType'],
  referralCode: '',
  email: '',
  ens: '',
  isPrimary,
});
type Field = Exclude<keyof WalletInput, 'isPrimary'>;
type Errors = Partial<Record<Field, string>>;

export function WalletsPage({ userId }: { userId: string }) {
  const wallets = useQuery({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => getWallets(signal),
    retry: false,
  });
  const [showSecondary, setShowSecondary] = useState(false);
  const [copyPrimary, setCopyPrimary] = useState(false);
  const primary = wallets.data?.items.find((item) => item.isPrimary);
  const secondary = wallets.data?.items.find((item) => !item.isPrimary);
  return (
    <div className="home-shell profile-shell mx-auto max-w-[1440px] px-16 pt-12 pb-16 max-[700px]:px-4 max-[700px]:pt-6 max-[700px]:pb-12">
      <SiteHeader />
      <main className="profile-layout mt-8 grid grid-cols-[310px_minmax(0,1fr)] items-start gap-8 max-[700px]:mt-0 max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-6">
        <AccountSidebar active="wallets" />
        {wallets.isPending ? (
          <div className="grid gap-6 *:h-[120px]" aria-label="Carregando carteiras">
            <Skeleton />
            <Skeleton />
          </div>
        ) : wallets.isError ? (
          <section role="alert" className="grid justify-items-start gap-4">
            <p>Não foi possível carregar as carteiras.</p>
            {axios.isAxiosError(wallets.error) && wallets.error.response?.status === 401 ? (
              <Link to="/login" search={{ redirect: '/account/wallets' }} className="text-primary">
                Entrar novamente
              </Link>
            ) : (
              <Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>
            )}
          </section>
        ) : (
          <div className="wallets-content">
            <div>
              <h1 className="text-lg font-bold">Carteira principal</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastro e conexão simulados, sem vínculo com blockchain ou gateway real. Nunca
              informe chaves privadas ou frases de recuperação.
            </p>
            <WalletForm
              userId={userId}
              initial={primary}
              isPrimary
              onDeleted={() => setCopyPrimary(false)}
            />
            {primary && <WalletConnectionControls userId={userId} wallet={primary} />}
            <section className="mt-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-bold">Carteira secundária</h2>
                <div className="flex flex-wrap items-center justify-between gap-4 max-[700px]:items-start">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={copyPrimary}
                      disabled={!primary}
                      onCheckedChange={(checked) => {
                        setCopyPrimary(checked === true);
                        if (checked === true) setShowSecondary(true);
                      }}
                    />{' '}
                    Igual à carteira principal
                  </label>
                  {!secondary && !showSecondary && (
                    <Button variant="outline" onClick={() => setShowSecondary(true)}>
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
              {secondary || showSecondary ? (
                <>
                  <WalletForm
                    key={String(copyPrimary)}
                    userId={userId}
                    initial={
                      copyPrimary && primary
                        ? {
                            ...primary,
                            id: secondary?.id ?? primary.id,
                            isPrimary: secondary ? false : true,
                          }
                        : secondary
                    }
                    isPrimary={false}
                    onDeleted={() => {
                      setShowSecondary(false);
                      setCopyPrimary(false);
                    }}
                  />
                  {secondary && <WalletConnectionControls userId={userId} wallet={secondary} />}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Você ainda não adicionou uma carteira secundária.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function WalletConnectionControls({ userId, wallet }: { userId: string; wallet: WalletRecord }) {
  const client = useQueryClient();
  const connection = useMutation({
    mutationFn: (input: WalletConnectionRequest) => updateWalletConnection(wallet.id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.wallets(userId) });
    },
  });
  const statusLabel =
    connection.isPending && connection.variables?.action === 'connect'
      ? 'Conectando...'
      : wallet.connectionStatus === 'connected'
        ? 'Conectada'
        : wallet.connectionStatus === 'rejected'
          ? 'Conexão recusada'
          : 'Desconectada';
  const statusBadgeClass =
    wallet.connectionStatus === 'connected'
      ? 'border-success text-success'
      : wallet.connectionStatus === 'rejected'
        ? 'border-destructive text-destructive'
        : 'border-border text-muted-foreground';
  return (
    <section
      className="mt-6 grid gap-3 rounded-md border border-border bg-surface p-4"
      aria-label={
        wallet.isPrimary ? 'Conexão da carteira principal' : 'Conexão da carteira secundária'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <strong>
          {wallet.label} ({wallet.network} · {wallet.walletType})
        </strong>
        <span
          className={`inline-flex items-center rounded-pill border bg-surface-raised px-3 py-1 text-xs font-bold ${statusBadgeClass}`}
          role="status"
        >
          {statusLabel}
        </span>
      </div>
      {wallet.connectionStatus === 'rejected' && (
        <p role="alert" className="mt-4 text-destructive">
          Conexão recusada pela carteira simulada. A confirmação de pagamento fica bloqueada até
          conectar uma carteira.
        </p>
      )}
      {connection.isError && (
        <p role="alert" className="mt-4 text-destructive">
          {axios.isAxiosError(connection.error) &&
          typeof connection.error.response?.data?.error?.message === 'string'
            ? connection.error.response.data.error.message
            : 'Não foi possível atualizar a conexão da carteira.'}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {wallet.connectionStatus === 'disconnected' && (
          <>
            <Button
              type="button"
              disabled={connection.isPending}
              onClick={() =>
                connection.mutate({
                  action: 'connect',
                  network: wallet.network,
                  walletType: wallet.walletType,
                })
              }
            >
              {connection.isPending ? 'Conectando...' : 'Conectar carteira'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={connection.isPending}
              onClick={() =>
                connection.mutate({
                  action: 'reject',
                  network: wallet.network,
                  walletType: wallet.walletType,
                })
              }
            >
              Simular recusa
            </Button>
          </>
        )}
        {wallet.connectionStatus === 'rejected' && (
          <Button
            type="button"
            variant="outline"
            disabled={connection.isPending}
            onClick={() =>
              connection.mutate({
                action: 'reset',
                network: wallet.network,
                walletType: wallet.walletType,
              })
            }
          >
            Tentar novamente
          </Button>
        )}
        {wallet.connectionStatus === 'connected' && (
          <Button
            type="button"
            variant="outline"
            disabled={connection.isPending}
            onClick={() =>
              connection.mutate({
                action: 'disconnect',
                network: wallet.network,
                walletType: wallet.walletType,
              })
            }
          >
            Desconectar carteira
          </Button>
        )}
      </div>
    </section>
  );
}

function WalletForm({
  userId,
  initial,
  isPrimary,
  onDeleted,
}: {
  userId: string;
  initial?: WalletRecord;
  isPrimary: boolean;
  onDeleted?: () => void;
}) {
  const id = useId();
  const client = useQueryClient();
  const savedWalletId = initial?.isPrimary === isPrimary ? initial.id : undefined;
  const [values, setValues] = useState<WalletInput>(() =>
    initial
      ? {
          displayName: initial.displayName,
          label: initial.label,
          network: initial.network as WalletInput['network'],
          profileName: initial.profileName,
          address: initial.address,
          secondaryAddress: initial.secondaryAddress,
          walletType: initial.walletType,
          referralCode: initial.referralCode,
          email: initial.email,
          ens: initial.ens,
          isPrimary,
        }
      : blank(isPrimary),
  );
  const [errors, setErrors] = useState<Errors>({});
  const mutation = useMutation({
    mutationFn: (input: WalletInput) => saveWallet(input, savedWalletId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.wallets(userId) });
    },
  });
  const removeMutation = useMutation({
    mutationFn: (walletId: string) => deleteWallet(walletId),
    onSuccess: async () => {
      setValues(blank(isPrimary));
      setErrors({});
      mutation.reset();
      onDeleted?.();
      await client.invalidateQueries({ queryKey: queryKeys.wallets(userId) });
    },
  });
  const set = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    mutation.reset();
    removeMutation.reset();
  };
  const field = (
    name: Field,
    label: string,
    options?: { placeholder?: string; type?: string; optional?: boolean },
  ) => (
    <label htmlFor={`${id}-${name}`} className="block text-sm text-foreground">
      {label}
      {!options?.optional && (
        <span aria-hidden="true" className="text-destructive">
          {' '}
          *
        </span>
      )}
      <Input
        id={`${id}-${name}`}
        type={options?.type ?? 'text'}
        value={values[name]}
        placeholder={options?.placeholder}
        aria-required={!options?.optional}
        onChange={(event) => set(name, event.target.value)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        className="mt-2 w-full"
      />
      {errors[name] && (
        <small id={`${id}-${name}-error`} className="mt-2 block text-destructive">
          {errors[name]}
        </small>
      )}
    </label>
  );
  const select = (
    name: 'network' | 'walletType',
    label: string,
    placeholder: string,
    choices: string[],
  ) => (
    <div>
      <label htmlFor={`${id}-${name}`} className="block text-sm text-foreground">
        {label}
        <span aria-hidden="true" className="text-destructive">
          {' '}
          *
        </span>
      </label>
      <Select value={values[name]} onValueChange={(value) => set(name, value)}>
        <SelectTrigger
          id={`${id}-${name}`}
          aria-required="true"
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
          className="mt-2 w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice} value={choice}>
              {choice}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[name] && (
        <small id={`${id}-${name}-error`} className="mt-2 block text-destructive">
          {errors[name]}
        </small>
      )}
    </div>
  );
  return (
    <form
      className="mt-8"
      aria-label={isPrimary ? 'Carteira principal' : 'Carteira secundária'}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        mutation.reset();
        removeMutation.reset();
        const parsed = walletInputSchema.safeParse(values);
        if (!parsed.success) {
          const next: Errors = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0] as Field;
            if (!next[key]) next[key] = issue.message;
          }
          setErrors(next);
          return;
        }
        setErrors({});
        mutation.mutate(parsed.data);
      }}
    >
      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-6 max-[700px]:grid-cols-[minmax(0,1fr)]">
        {field('displayName', 'Nome de exibição')}
        {field('label', 'Apelido da carteira')}
        {select('network', 'Rede', 'Selecione uma rede', ['Ethereum', 'Polygon'])}
        {field('profileName', 'Nome do perfil')}
        {field('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira' })}
        {field('secondaryAddress', 'ENS ou carteira secundária', { optional: true })}
        {select('walletType', 'Tipo de carteira', 'Selecione uma carteira', [
          'MetaMask',
          'WalletConnect',
          'Coinbase Wallet',
          'Outra',
        ])}
        {field('referralCode', 'Código de indicação')}
        {field('email', 'E-mail', { type: 'email' })}
        {field('ens', 'Nome ENS', { placeholder: 'exemplo.eth' })}
      </div>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-4 text-destructive">
          Confira os campos destacados.
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="mt-4 text-destructive">
          {axios.isAxiosError(mutation.error) &&
          typeof mutation.error.response?.data?.error?.message === 'string'
            ? mutation.error.response.data.error.message
            : 'Não foi possível salvar a carteira.'}
        </p>
      )}
      {removeMutation.isError && (
        <p role="alert" className="mt-4 text-destructive">
          {axios.isAxiosError(removeMutation.error) &&
          typeof removeMutation.error.response?.data?.error?.message === 'string'
            ? removeMutation.error.response.data.error.message
            : 'Não foi possível remover a carteira.'}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="mt-4 text-success">
          Carteira salva.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-4">
        <Button type="submit" disabled={mutation.isPending || removeMutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar carteira'}
        </Button>
        {savedWalletId && (
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending || removeMutation.isPending}
            onClick={() => {
              mutation.reset();
              removeMutation.mutate(savedWalletId);
            }}
          >
            {removeMutation.isPending ? 'Removendo...' : 'Remover carteira'}
          </Button>
        )}
      </div>
    </form>
  );
}
