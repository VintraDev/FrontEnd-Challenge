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
import '@/features/catalog/home.css';
import '@/features/profile/profile.css';
import './wallets.css';

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
    <div className="home-shell profile-shell">
      <SiteHeader />
      <main className="profile-layout">
        <AccountSidebar active="wallets" />
        {wallets.isPending ? (
          <div className="profile-loading" aria-label="Carregando carteiras">
            <Skeleton />
            <Skeleton />
          </div>
        ) : wallets.isError ? (
          <section role="alert" className="profile-feedback">
            <p>Não foi possível carregar as carteiras.</p>
            {axios.isAxiosError(wallets.error) && wallets.error.response?.status === 401 ? (
              <Link to="/login" search={{ redirect: '/account/wallets' }}>
                Entrar novamente
              </Link>
            ) : (
              <Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>
            )}
          </section>
        ) : (
          <div className="wallets-content">
            <div className="wallets-heading">
              <h1>Carteira principal</h1>
            </div>
            <p className="wallets-description">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
            <p className="wallets-description">
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
            <section className="wallets-secondary">
              <div className="wallets-secondary-heading">
                <h2>Carteira secundária</h2>
                <div className="wallets-secondary-actions">
                  <label>
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
                <p className="wallets-description">
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
  return (
    <section
      className="wallets-connection"
      aria-label={
        wallet.isPrimary ? 'Conexão da carteira principal' : 'Conexão da carteira secundária'
      }
    >
      <div className="wallets-connection-info">
        <strong>
          {wallet.label} ({wallet.network} · {wallet.walletType})
        </strong>
        <span
          className={`wallets-status-badge wallets-status-badge--${wallet.connectionStatus}`}
          role="status"
        >
          {statusLabel}
        </span>
      </div>
      {wallet.connectionStatus === 'rejected' && (
        <p role="alert" className="wallets-error">
          Conexão recusada pela carteira simulada. A confirmação de pagamento fica bloqueada até
          conectar uma carteira.
        </p>
      )}
      {connection.isError && (
        <p role="alert" className="wallets-error">
          {axios.isAxiosError(connection.error) &&
          typeof connection.error.response?.data?.error?.message === 'string'
            ? connection.error.response.data.error.message
            : 'Não foi possível atualizar a conexão da carteira.'}
        </p>
      )}
      <div className="wallets-connection-actions">
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
    <label htmlFor={`${id}-${name}`}>
      {label}
      {!options?.optional && <span aria-hidden="true"> *</span>}
      <Input
        id={`${id}-${name}`}
        type={options?.type ?? 'text'}
        value={values[name]}
        placeholder={options?.placeholder}
        aria-required={!options?.optional}
        onChange={(event) => set(name, event.target.value)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
      />
      {errors[name] && <small id={`${id}-${name}-error`}>{errors[name]}</small>}
    </label>
  );
  const select = (
    name: 'network' | 'walletType',
    label: string,
    placeholder: string,
    choices: string[],
  ) => (
    <div className="wallets-field">
      <label htmlFor={`${id}-${name}`}>
        {label}
        <span aria-hidden="true"> *</span>
      </label>
      <Select value={values[name]} onValueChange={(value) => set(name, value)}>
        <SelectTrigger
          id={`${id}-${name}`}
          aria-required="true"
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
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
      {errors[name] && <small id={`${id}-${name}-error`}>{errors[name]}</small>}
    </div>
  );
  return (
    <form
      className="wallets-form"
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
      <div className="wallets-fields">
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
        <p role="alert" className="wallets-error">
          Confira os campos destacados.
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="wallets-error">
          {axios.isAxiosError(mutation.error) &&
          typeof mutation.error.response?.data?.error?.message === 'string'
            ? mutation.error.response.data.error.message
            : 'Não foi possível salvar a carteira.'}
        </p>
      )}
      {removeMutation.isError && (
        <p role="alert" className="wallets-error">
          {axios.isAxiosError(removeMutation.error) &&
          typeof removeMutation.error.response?.data?.error?.message === 'string'
            ? removeMutation.error.response.data.error.message
            : 'Não foi possível remover a carteira.'}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="wallets-success">
          Carteira salva.
        </p>
      )}
      <div className="wallets-form-actions">
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
