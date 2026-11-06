import { queryKeys } from '@/lib/query-keys';
import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreateOrderRequest } from '@/contracts/checkout';
import {
  walletInputSchema,
  type WalletConnectionRequest,
  type WalletInput,
  type WalletProvider,
  type WalletRecord,
  type WalletSupportedNetwork,
} from '@/contracts/wallets';
import { getCart, getQuote } from '@/features/cart/api';
import { useSession } from '@/features/auth/session';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { getWallets, updateWalletConnection } from '@/features/wallets/api';
import { createOrder, getOrderByKey } from '@/features/orders/api';
import '@/features/catalog/home.css';
import './checkout.css';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const compactWalletAddress = (address: string) =>
  address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

type CollectorField = Exclude<keyof WalletInput, 'isPrimary'>;
type CollectorDraft = Partial<Record<CollectorField, string>>;
type CollectorErrors = Partial<Record<CollectorField, string>>;
type StoredOrderAttempt = {
  idempotencyKey: string;
  payload: CreateOrderRequest;
};

function readStoredAttempt(storageKey: string): StoredOrderAttempt | undefined {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<StoredOrderAttempt>;
    if (
      typeof parsed?.idempotencyKey === 'string' &&
      parsed.payload &&
      typeof parsed.payload.quoteId === 'string' &&
      typeof parsed.payload.walletId === 'string' &&
      typeof parsed.payload.network === 'string' &&
      typeof parsed.payload.acceptedQuoteVersion === 'string' &&
      typeof parsed.payload.acceptedQuoteHash === 'string'
    ) {
      return parsed as StoredOrderAttempt;
    }
  } catch {
    // Ignore malformed sessionStorage entry.
  }
  return undefined;
}

export function CheckoutPage() {
  const formId = useId();
  const client = useQueryClient();
  const navigate = useNavigate();
  const session = useSession();
  const userId = session.data?.user.id;
  const scope = userId ?? 'guest';
  const submittingRef = useRef(false);
  const [showMobileReview, setShowMobileReview] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<'primary' | 'secondary' | null>(null);
  const [draft, setDraft] = useState<CollectorDraft>({});
  const [collectorNote, setCollectorNote] = useState('');
  const [formErrors, setFormErrors] = useState<CollectorErrors>({});
  const [formValidated, setFormValidated] = useState(false);
  const [reviewedQuoteHash, setReviewedQuoteHash] = useState<string>();
  const [quoteReviewMessage, setQuoteReviewMessage] = useState('');
  const [quoteClock, setQuoteClock] = useState(() => Date.now());

  const cart = useQuery({
    queryKey: queryKeys.cart(scope),
    queryFn: ({ signal }) => getCart(signal),
    enabled: !session.isPending,
    refetchOnMount: 'always',
  });
  const wallets = useQuery({
    queryKey: queryKeys.wallets(scope),
    queryFn: ({ signal }) => getWallets(signal),
    enabled: !!userId && !session.isPending,
    retry: false,
    refetchOnMount: 'always',
  });

  const savedWallets = wallets.data?.items ?? [];
  const primaryWallet = savedWallets.find((item) => item.isPrimary) ?? savedWallets[0];
  const secondaryWallet = savedWallets.find(
    (item) => !item.isPrimary && item.id !== primaryWallet?.id,
  );
  const useSecondary =
    selectedSlot !== null
      ? selectedSlot === 'secondary' && !!secondaryWallet
      : secondaryWallet?.connectionStatus === 'connected' &&
        primaryWallet?.connectionStatus !== 'connected';
  const activeWallet: WalletRecord | undefined =
    useSecondary && secondaryWallet ? secondaryWallet : primaryWallet;
  const mobileWallets = [secondaryWallet, primaryWallet].filter(
    (wallet): wallet is WalletRecord => !!wallet,
  );
  const selectedNetwork = (draft.network ?? activeWallet?.network) as
    WalletSupportedNetwork | undefined;
  const quoteContext =
    activeWallet?.connectionStatus === 'connected' && selectedNetwork
      ? { walletId: activeWallet.id, network: selectedNetwork }
      : undefined;
  const quote = useQuery({
    queryKey: queryKeys.quote(scope, cart.data?.version, quoteContext),
    queryFn: ({ signal }) => getQuote(cart.data!.version, quoteContext, signal),
    enabled: !!cart.data && cart.data.lines.length > 0 && !cart.isFetching,
    retry: false,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    const expiresAt = quote.data?.expiresAt;
    if (!expiresAt) return;
    const timer = window.setTimeout(
      () => setQuoteClock(Date.now()),
      Math.max(0, Date.parse(expiresAt) - Date.now()) + 1,
    );
    return () => window.clearTimeout(timer);
  }, [quote.data?.expiresAt]);

  useEffect(() => {
    if (!userId) return;
    const pendingKey = sessionStorage.getItem(`kurio-pending-attempt:${userId}`);
    if (!pendingKey) return;
    let cancelled = false;
    void getOrderByKey(pendingKey)
      .then(async (recovered) => {
        if (cancelled) return;
        sessionStorage.removeItem(`kurio-pending-attempt:${userId}`);
        await client.invalidateQueries({ queryKey: queryKeys.cart(scope) });
        await navigate({ to: '/orders/$orderId', params: { orderId: recovered.id } });
      })
      .catch(() => {
        // Attempt was not committed or still unreachable; keep key for manual retry.
      });
    return () => {
      cancelled = true;
    };
  }, [client, navigate, scope, userId]);

  const connectionMutation = useMutation({
    mutationFn: ({ walletId, input }: { walletId: string; input: WalletConnectionRequest }) =>
      updateWalletConnection(walletId, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.wallets(scope) });
      await client.invalidateQueries({ queryKey: ['quote'] });
    },
  });
  const orderMutation = useMutation({
    mutationFn: async ({
      quoteId,
      quoteHash,
      version,
      walletId,
      network,
    }: {
      quoteId: string;
      quoteHash: string;
      version: string;
      walletId: string;
      network: WalletSupportedNetwork;
    }) => {
      const storageKey = `kurio-order-attempt:${userId}:${quoteHash}`;
      const existing = readStoredAttempt(storageKey);
      const attempt: StoredOrderAttempt = existing ?? {
        idempotencyKey: crypto.randomUUID(),
        payload: {
          quoteId,
          walletId,
          network,
          acceptedQuoteVersion: version,
          acceptedQuoteHash: quoteHash,
        },
      };
      sessionStorage.setItem(storageKey, JSON.stringify(attempt));
      if (userId) sessionStorage.setItem(`kurio-pending-attempt:${userId}`, attempt.idempotencyKey);
      try {
        return await createOrder(attempt.payload, attempt.idempotencyKey);
      } catch (error) {
        if (axios.isAxiosError(error) && !error.response)
          return getOrderByKey(attempt.idempotencyKey);
        throw error;
      }
    },
    onSuccess: async (order) => {
      if (userId) sessionStorage.removeItem(`kurio-pending-attempt:${userId}`);
      await client.invalidateQueries({ queryKey: queryKeys.cart(scope) });
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
    },
  });

  const valueOf = (field: CollectorField): string => {
    if (draft[field] !== undefined) return draft[field]!;
    if (!activeWallet) return '';
    return activeWallet[field];
  };

  const setField = (field: CollectorField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setFormValidated(false);
  };

  const selectSlot = (slot: 'primary' | 'secondary') => {
    setSelectedSlot(slot);
    setDraft({});
    setFormErrors({});
    setFormValidated(false);
    setReviewedQuoteHash(undefined);
    setQuoteReviewMessage('');
    connectionMutation.reset();
  };

  const selectNetwork = (network: WalletSupportedNetwork) => {
    setField('network', network);
    setReviewedQuoteHash(undefined);
    setQuoteReviewMessage('');
    if (activeWallet) {
      connectionMutation.mutate({
        walletId: activeWallet.id,
        input: { action: 'select', network },
      });
    }
  };

  const selectProvider = (walletType: WalletProvider) => {
    setField('walletType', walletType);
    if (activeWallet) {
      connectionMutation.mutate({
        walletId: activeWallet.id,
        input: { action: 'select', walletType },
      });
    }
  };

  const triggerConnection = (action: WalletConnectionRequest['action']) => {
    if (!activeWallet) return;
    const currentNetwork = (valueOf('network') || activeWallet.network) as WalletSupportedNetwork;
    const currentProvider = (valueOf('walletType') || activeWallet.walletType) as WalletProvider;
    connectionMutation.mutate({
      walletId: activeWallet.id,
      input: {
        action,
        network:
          currentNetwork === 'Ethereum' || currentNetwork === 'Polygon'
            ? currentNetwork
            : activeWallet.network,
        walletType: currentProvider || activeWallet.walletType,
      },
    });
    setReviewedQuoteHash(undefined);
    setQuoteReviewMessage('');
  };

  const quoteExpired = !!quote.data && Date.parse(quote.data.expiresAt) <= quoteClock;
  const quoteMatchesWallet =
    !!quote.data &&
    !!quoteContext &&
    quote.data.walletId === quoteContext.walletId &&
    quote.data.network === quoteContext.network;
  const quoteReviewed =
    !!quote.data && !quoteExpired && Boolean(reviewedQuoteHash) && quoteMatchesWallet;
  const canConfirm =
    formValidated &&
    activeWallet?.connectionStatus === 'connected' &&
    quoteReviewed &&
    !quote.isFetching &&
    !orderMutation.isPending;
  const quoteBlocker = !activeWallet
    ? 'Selecione uma carteira para confirmar a compra.'
    : activeWallet.connectionStatus !== 'connected'
      ? 'Conecte a carteira selecionada para gerar uma cotação de confirmação.'
      : quote.isError
        ? 'Não foi possível gerar a cotação atual.'
        : quoteExpired
          ? 'A cotação expirou. Revalide antes de continuar.'
          : !quoteReviewed
            ? 'Revalide a cotação antes de confirmar a compra.'
            : !formValidated
              ? 'Valide os dados do colecionador antes de confirmar a compra.'
              : '';

  const revalidateQuote = async () => {
    setQuoteReviewMessage('');
    orderMutation.reset();
    const result = await quote.refetch();
    const next = result.data;
    if (!next) return;
    if (Date.parse(next.expiresAt) <= Date.now()) {
      setReviewedQuoteHash(undefined);
      setQuoteReviewMessage('A cotação retornada já expirou. Tente novamente.');
      return;
    }
    setReviewedQuoteHash(next.quoteHash);
    setQuoteReviewMessage('Cotação revisada. Preço, estoque, cupom e rede estão atuais.');
  };

  const confirmQuote = async () => {
    if (!canConfirm || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const result = await quote.refetch();
      const next = result.data;
      if (
        !next ||
        Date.parse(next.expiresAt) <= Date.now() ||
        next.quoteHash !== reviewedQuoteHash
      ) {
        setReviewedQuoteHash(undefined);
        setQuoteReviewMessage(
          'A cotação mudou durante a confirmação. Revise os valores e confirme novamente.',
        );
        return;
      }
      if (!quoteContext) return;
      const storageKey = `kurio-order-attempt:${userId}:${next.quoteHash}`;
      const existingAttempt = readStoredAttempt(storageKey);
      await orderMutation.mutateAsync({
        quoteId: existingAttempt?.payload.quoteId ?? next.id,
        quoteHash: next.quoteHash,
        version: existingAttempt?.payload.acceptedQuoteVersion ?? next.version,
        walletId: quoteContext.walletId,
        network: quoteContext.network,
      });
    } finally {
      submittingRef.current = false;
    }
  };

  const renderWalletConnectionActions = (wallet: WalletRecord | undefined) => {
    if (!wallet) {
      return (
        <Button type="button" variant="outline" disabled>
          Conectar carteira
        </Button>
      );
    }
    return (
      <div className="checkout-wallet-actions">
        {wallet.connectionStatus === 'disconnected' && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={connectionMutation.isPending}
              onClick={() => triggerConnection('connect')}
            >
              {connectionMutation.isPending &&
              connectionMutation.variables?.input.action === 'connect'
                ? 'Conectando...'
                : 'Conectar carteira'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={connectionMutation.isPending}
              onClick={() => triggerConnection('reject')}
            >
              Simular recusa
            </Button>
          </>
        )}
        {wallet.connectionStatus === 'rejected' && (
          <Button
            type="button"
            variant="outline"
            disabled={connectionMutation.isPending}
            onClick={() => triggerConnection('reset')}
          >
            Tentar novamente
          </Button>
        )}
        {wallet.connectionStatus === 'connected' && (
          <Button
            type="button"
            variant="outline"
            disabled={connectionMutation.isPending}
            onClick={() => triggerConnection('disconnect')}
          >
            Desconectar carteira
          </Button>
        )}
      </div>
    );
  };

  const renderWalletStatusFeedback = (wallet: WalletRecord | undefined) => {
    if (!wallet) return null;
    const statusText =
      connectionMutation.isPending && connectionMutation.variables?.input.action === 'connect'
        ? 'Solicitando conexão simulada...'
        : wallet.connectionStatus === 'connected'
          ? `Carteira conectada na rede ${wallet.network}`
          : wallet.connectionStatus === 'rejected'
            ? 'Conexão recusada'
            : 'Carteira desconectada';
    return (
      <div className="checkout-wallet-status-block">
        <div className="checkout-wallet-status-row">
          <span
            className={`checkout-wallet-badge checkout-wallet-badge--${wallet.connectionStatus}`}
            role="status"
          >
            {statusText}
          </span>
          <small>
            {wallet.isPrimary ? 'Principal' : 'Secundária'} · {wallet.network} · {wallet.walletType}
          </small>
        </div>
        {wallet.connectionStatus === 'rejected' && (
          <p role="alert" className="checkout-wallet-alert">
            Conexão recusada pela carteira simulada. A compra permanece bloqueada até conectar uma
            carteira.
          </p>
        )}
        {connectionMutation.isError && (
          <p role="alert" className="checkout-wallet-alert">
            {axios.isAxiosError(connectionMutation.error) &&
            typeof connectionMutation.error.response?.data?.error?.message === 'string'
              ? connectionMutation.error.response.data.error.message
              : 'Não foi possível atualizar a conexão da carteira.'}
          </p>
        )}
      </div>
    );
  };

  const renderQuoteReviewControls = () => (
    <section className="checkout-quote-review" aria-label="Validação da cotação">
      {quote.data && (
        <p className="checkout-quote-reference">
          Cotação {quote.data.id} · versão {quote.data.version}
          {quote.data.network ? ` · ${quote.data.network}` : ''}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={!quoteContext || quote.isFetching}
        onClick={() => void revalidateQuote()}
      >
        {quote.isFetching ? 'Atualizando cotação...' : 'Revalidar cotação'}
      </Button>
      {quoteBlocker && <p className="checkout-quote-blocker">{quoteBlocker}</p>}
      {quoteReviewMessage && (
        <p
          className={quoteReviewed ? 'checkout-quote-valid' : 'checkout-quote-blocker'}
          role={quoteReviewed ? 'status' : 'alert'}
        >
          {quoteReviewMessage}
        </p>
      )}
      {orderMutation.isError && (
        <p className="checkout-quote-blocker" role="alert">
          {axios.isAxiosError(orderMutation.error) &&
          typeof orderMutation.error.response?.data?.error?.message === 'string'
            ? orderMutation.error.response.data.error.message
            : 'Não foi possível concluir a tentativa de pedido. Tente recuperar a tentativa atual.'}
        </p>
      )}
    </section>
  );

  return (
    <div className="home-shell checkout-shell">
      <SiteHeader />
      <main>
        <div className="checkout-mobile-header">
          <Link to="/cart" aria-label="Voltar ao carrinho">
            <ArrowLeft size={20} />
          </Link>
          <h1>Pagamento com carteira</h1>
        </div>
        <nav className="checkout-breadcrumb" aria-label="Trilha de navegação">
          <Link to="/" search={homeSearch}>
            Início
          </Link>{' '}
          / <Link to="/cart">Carrinho</Link> / Pagamento
        </nav>
        <h1 className="checkout-title">Pagamento</h1>
        <p className="checkout-notice" role="status">
          Prévia de pagamento: a confirmação de pedidos ainda não está disponível e os dados
          preenchidos não são salvos automaticamente. Conexão de carteira 100% simulada, sem
          blockchain real.{' '}
          <Link to="/orders/$orderId" params={{ orderId: 'preview' }}>
            Visualizar prévia do comprovante
          </Link>
        </p>
        {cart.isPending ? (
          <div className="checkout-loading" aria-label="Carregando carrinho">
            <Skeleton />
            <Skeleton />
          </div>
        ) : cart.isError ? (
          <section className="checkout-feedback" role="alert">
            <h2>Não foi possível carregar o carrinho.</h2>
            <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
          </section>
        ) : cart.data.lines.length === 0 ? (
          <section className="checkout-feedback">
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione NFTs para revisar o pagamento.</p>
            <Link className={buttonVariants()} to="/" search={homeSearch}>
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <>
            <section className="checkout-mobile-wallet" aria-label="Pagamento com carteira">
              <div className="checkout-mobile-wallet-heading">
                <h2>Carteira conectada</h2>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!secondaryWallet}
                  onClick={() => selectSlot(useSecondary ? 'primary' : 'secondary')}
                >
                  Trocar carteira
                </Button>
              </div>
              {savedWallets.length === 0 ? (
                <div className="checkout-mobile-empty">
                  <Wallet size={20} aria-hidden="true" />
                  <div>
                    <strong>Nenhuma carteira conectada</strong>
                    <p>
                      O cadastro e a conexão de carteiras estão disponíveis na sua conta.{' '}
                      <Link to="/account/wallets">Gerenciar carteiras</Link>
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="checkout-mobile-cards"
                  role="radiogroup"
                  aria-label="Carteiras cadastradas"
                >
                  {mobileWallets.map((wallet) => {
                    const isSelected = activeWallet?.id === wallet.id;
                    return (
                      <label
                        key={wallet.id}
                        className={`checkout-mobile-card${isSelected ? ' checkout-mobile-card--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="checkout-mobile-saved-wallet"
                          checked={isSelected}
                          onChange={() => selectSlot(wallet.isPrimary ? 'primary' : 'secondary')}
                        />
                        <div className="checkout-mobile-card-body">
                          <strong>{wallet.isPrimary ? 'Principal' : 'Reserva'}</strong>
                          <span>{wallet.ens || compactWalletAddress(wallet.address)}</span>
                          <small>Rede {wallet.network}</small>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {activeWallet?.connectionStatus !== 'connected' && (
                <>
                  {renderWalletStatusFeedback(activeWallet)}
                  {renderWalletConnectionActions(activeWallet)}
                </>
              )}
              <fieldset disabled={!activeWallet} className="checkout-mobile-providers">
                <legend>Carteira e rede</legend>
                {(['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const).map((provider) => (
                  <label key={provider}>
                    <span className="checkout-provider-icon" aria-hidden="true">
                      {provider === 'WalletConnect' ? (
                        'W'
                      ) : provider === 'MetaMask' ? (
                        'M'
                      ) : (
                        <Wallet size={20} />
                      )}
                    </span>
                    <span>{provider}</span>
                    <input
                      type="radio"
                      name="wallet-provider"
                      checked={valueOf('walletType') === provider}
                      onChange={() => selectProvider(provider)}
                    />
                  </label>
                ))}
              </fieldset>
              <div className="checkout-mobile-total">
                <strong>Total:</strong>
                {cart.isFetching || quote.isPending ? (
                  <span role="status">Calculando...</span>
                ) : quote.isError ? (
                  <span>Indisponível</span>
                ) : (
                  <strong>{quote.data?.totalEth} ETH</strong>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="checkout-review-toggle"
                aria-expanded={showMobileReview}
                aria-controls="checkout-review"
                onClick={() => setShowMobileReview((value) => !value)}
              >
                {showMobileReview ? 'Ocultar dados da revisão' : 'Revisar dados e NFTs'}
              </Button>
              {renderQuoteReviewControls()}
              <div className="checkout-mobile-confirm">
                <Button type="button" disabled={!canConfirm} onClick={() => void confirmQuote()}>
                  {orderMutation.isPending ? 'Criando pedido...' : 'Confirmar compra'}
                </Button>
              </div>
            </section>
            <div
              id="checkout-review"
              className={`checkout-layout${showMobileReview ? ' checkout-layout--expanded' : ''}`}
            >
              <section className="checkout-profile">
                <h2>Perfil do colecionador</h2>
                <form
                  aria-label="Perfil do colecionador"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    const candidate: WalletInput = {
                      displayName: valueOf('displayName'),
                      label: valueOf('label'),
                      network: valueOf('network') as WalletInput['network'],
                      profileName: valueOf('profileName'),
                      address: valueOf('address'),
                      secondaryAddress: valueOf('secondaryAddress'),
                      walletType: valueOf('walletType') as WalletInput['walletType'],
                      referralCode: valueOf('referralCode'),
                      email: valueOf('email'),
                      ens: valueOf('ens'),
                      isPrimary: activeWallet?.isPrimary ?? true,
                    };
                    const parsed = walletInputSchema.safeParse(candidate);
                    if (!parsed.success) {
                      const nextErrors: CollectorErrors = {};
                      for (const issue of parsed.error.issues) {
                        const key = issue.path[0] as CollectorField;
                        if (!nextErrors[key]) nextErrors[key] = issue.message;
                      }
                      setFormErrors(nextErrors);
                      setFormValidated(false);
                      return;
                    }
                    setFormErrors({});
                    setFormValidated(true);
                  }}
                >
                  <div className="checkout-fields">
                    <label htmlFor={`${formId}-displayName`}>
                      Nome de exibição <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-displayName`}
                        autoComplete="nickname"
                        placeholder="Nome de exibição"
                        value={valueOf('displayName')}
                        aria-required="true"
                        aria-invalid={!!formErrors.displayName}
                        aria-describedby={
                          formErrors.displayName ? `${formId}-displayName-error` : undefined
                        }
                        onChange={(event) => setField('displayName', event.target.value)}
                      />
                      {formErrors.displayName && (
                        <small id={`${formId}-displayName-error`} className="checkout-field-error">
                          {formErrors.displayName}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-label`}>
                      Nome de usuário <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-label`}
                        autoComplete="username"
                        placeholder="Nome de usuário"
                        value={valueOf('label')}
                        aria-required="true"
                        aria-invalid={!!formErrors.label}
                        aria-describedby={formErrors.label ? `${formId}-label-error` : undefined}
                        onChange={(event) => setField('label', event.target.value)}
                      />
                      {formErrors.label && (
                        <small id={`${formId}-label-error`} className="checkout-field-error">
                          {formErrors.label}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-network`}>
                      Rede <span aria-hidden="true">*</span>
                      <Select
                        value={valueOf('network')}
                        onValueChange={(value) => selectNetwork(value as WalletSupportedNetwork)}
                      >
                        <SelectTrigger
                          id={`${formId}-network`}
                          aria-label="Rede"
                          aria-required="true"
                          aria-invalid={!!formErrors.network}
                          aria-describedby={
                            formErrors.network ? `${formId}-network-error` : undefined
                          }
                        >
                          <SelectValue placeholder="Selecione uma rede" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ethereum">Ethereum</SelectItem>
                          <SelectItem value="Polygon">Polygon</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.network && (
                        <small id={`${formId}-network-error`} className="checkout-field-error">
                          {formErrors.network}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-profileName`}>
                      Nome do perfil <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-profileName`}
                        placeholder="Nome do perfil"
                        value={valueOf('profileName')}
                        aria-required="true"
                        aria-invalid={!!formErrors.profileName}
                        aria-describedby={
                          formErrors.profileName ? `${formId}-profileName-error` : undefined
                        }
                        onChange={(event) => setField('profileName', event.target.value)}
                      />
                      {formErrors.profileName && (
                        <small id={`${formId}-profileName-error`} className="checkout-field-error">
                          {formErrors.profileName}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-address`}>
                      Endereço da carteira <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-address`}
                        autoComplete="off"
                        placeholder="Endereço da carteira"
                        value={valueOf('address')}
                        aria-required="true"
                        aria-invalid={!!formErrors.address}
                        aria-describedby={
                          formErrors.address ? `${formId}-address-error` : undefined
                        }
                        onChange={(event) => setField('address', event.target.value)}
                      />
                      {formErrors.address && (
                        <small id={`${formId}-address-error`} className="checkout-field-error">
                          {formErrors.address}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-secondaryAddress`}>
                      ENS ou carteira secundária (opcional)
                      <Input
                        id={`${formId}-secondaryAddress`}
                        autoComplete="off"
                        placeholder="ENS ou carteira secundária"
                        value={valueOf('secondaryAddress')}
                        aria-invalid={!!formErrors.secondaryAddress}
                        aria-describedby={
                          formErrors.secondaryAddress
                            ? `${formId}-secondaryAddress-error`
                            : undefined
                        }
                        onChange={(event) => setField('secondaryAddress', event.target.value)}
                      />
                      {formErrors.secondaryAddress && (
                        <small
                          id={`${formId}-secondaryAddress-error`}
                          className="checkout-field-error"
                        >
                          {formErrors.secondaryAddress}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-walletType`}>
                      Tipo de carteira <span aria-hidden="true">*</span>
                      <Select
                        value={valueOf('walletType')}
                        onValueChange={(value) => selectProvider(value as WalletProvider)}
                      >
                        <SelectTrigger
                          id={`${formId}-walletType`}
                          aria-label="Tipo de carteira"
                          aria-required="true"
                          aria-invalid={!!formErrors.walletType}
                          aria-describedby={
                            formErrors.walletType ? `${formId}-walletType-error` : undefined
                          }
                        >
                          <SelectValue placeholder="Selecione uma carteira" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MetaMask">MetaMask</SelectItem>
                          <SelectItem value="WalletConnect">WalletConnect</SelectItem>
                          <SelectItem value="Coinbase Wallet">Coinbase Wallet</SelectItem>
                          <SelectItem value="Outra">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.walletType && (
                        <small id={`${formId}-walletType-error`} className="checkout-field-error">
                          {formErrors.walletType}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-referralCode`}>
                      Código de indicação <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-referralCode`}
                        placeholder="Código de indicação"
                        value={valueOf('referralCode')}
                        aria-required="true"
                        aria-invalid={!!formErrors.referralCode}
                        aria-describedby={
                          formErrors.referralCode ? `${formId}-referralCode-error` : undefined
                        }
                        onChange={(event) => setField('referralCode', event.target.value)}
                      />
                      {formErrors.referralCode && (
                        <small id={`${formId}-referralCode-error`} className="checkout-field-error">
                          {formErrors.referralCode}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-email`}>
                      E-mail <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-email`}
                        type="email"
                        autoComplete="email"
                        placeholder="E-mail"
                        value={valueOf('email')}
                        aria-required="true"
                        aria-invalid={!!formErrors.email}
                        aria-describedby={formErrors.email ? `${formId}-email-error` : undefined}
                        onChange={(event) => setField('email', event.target.value)}
                      />
                      {formErrors.email && (
                        <small id={`${formId}-email-error`} className="checkout-field-error">
                          {formErrors.email}
                        </small>
                      )}
                    </label>
                    <label htmlFor={`${formId}-ens`}>
                      Nome ENS <span aria-hidden="true">*</span>
                      <Input
                        id={`${formId}-ens`}
                        placeholder=".eth"
                        value={valueOf('ens')}
                        aria-required="true"
                        aria-invalid={!!formErrors.ens}
                        aria-describedby={formErrors.ens ? `${formId}-ens-error` : undefined}
                        onChange={(event) => setField('ens', event.target.value)}
                      />
                      {formErrors.ens && (
                        <small id={`${formId}-ens-error`} className="checkout-field-error">
                          {formErrors.ens}
                        </small>
                      )}
                    </label>
                  </div>
                  <label className="checkout-checkbox">
                    <Checkbox
                      checked={useSecondary}
                      disabled={!secondaryWallet}
                      onCheckedChange={(checked) =>
                        selectSlot(checked === true ? 'secondary' : 'primary')
                      }
                    />{' '}
                    Usar outra carteira?{' '}
                    <span>
                      {secondaryWallet
                        ? `(${secondaryWallet.label})`
                        : '(cadastre uma carteira secundária na conta)'}
                    </span>
                  </label>
                  <label className="checkout-note" htmlFor={`${formId}-collector-note`}>
                    Observação do colecionador (opcional)
                    <textarea
                      id={`${formId}-collector-note`}
                      rows={6}
                      placeholder="Adicione uma observação"
                      value={collectorNote}
                      onChange={(event) => setCollectorNote(event.target.value)}
                    />
                  </label>
                  {Object.keys(formErrors).length > 0 && (
                    <p role="alert" className="checkout-wallet-alert">
                      Confira os campos obrigatórios do colecionador.
                    </p>
                  )}
                  {formValidated && (
                    <p role="status" className="checkout-wallet-connected">
                      Dados do colecionador validados para a revisão.
                    </p>
                  )}
                  <div className="checkout-profile-actions">
                    <Button type="submit" variant="outline">
                      Validar dados
                    </Button>
                    <Link className={buttonVariants({ variant: 'outline' })} to="/account/wallets">
                      Gerenciar carteiras
                    </Link>
                  </div>
                </form>
              </section>
              <aside className="checkout-summary">
                <h2>Seus NFTs</h2>
                <div className="checkout-summary-heading">
                  <strong>NFTs</strong>
                  <strong>Subtotal</strong>
                </div>
                <div className="checkout-items">
                  {cart.data.lines.map((line) => (
                    <article className="checkout-item" key={line.id}>
                      <img src={line.image} alt="" />
                      <div>
                        <strong>{line.title}</strong>
                        <small>
                          Edição {line.editionLabel} · {line.quantity}{' '}
                          {line.quantity === 1 ? 'unidade' : 'unidades'}
                        </small>
                      </div>
                      <strong>{line.lineTotalEth} ETH</strong>
                    </article>
                  ))}
                </div>
                <Link className="checkout-coupon-link" to="/cart">
                  Tem um código promocional? Aplique no carrinho
                </Link>
                {cart.data.coupon && (
                  <p className="checkout-coupon">Cupom aplicado: {cart.data.coupon}</p>
                )}
                {cart.isFetching || quote.isPending ? (
                  <p role="status">Atualizando cotação...</p>
                ) : quote.isError ? (
                  <div role="alert" className="checkout-feedback">
                    <p>Não foi possível atualizar a cotação.</p>
                    <Button variant="outline" onClick={() => void cart.refetch()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  quote.data && (
                    <dl className="checkout-totals">
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{quote.data.subtotalEth} ETH</dd>
                      </div>
                      <div>
                        <dt>Desconto do lançamento</dt>
                        <dd>− {quote.data.discountEth} ETH</dd>
                      </div>
                      <div>
                        <dt>Taxa de rede estimada</dt>
                        <dd>{quote.data.networkFeeEth} ETH</dd>
                      </div>
                      <div className="checkout-total">
                        <dt>Total</dt>
                        <dd>{quote.data.totalEth} ETH</dd>
                      </div>
                    </dl>
                  )
                )}
                <div className="checkout-desktop-wallet">
                  <h2 className="checkout-wallet-title">Carteira e rede</h2>
                  {!activeWallet ? (
                    <p className="checkout-wallet-note">
                      Nenhuma carteira cadastrada na sua conta.{' '}
                      <Link to="/account/wallets">Cadastrar carteira</Link>
                    </p>
                  ) : (
                    <div className="checkout-wallet-summary">
                      <strong>
                        {activeWallet.displayName} ({activeWallet.label})
                      </strong>
                      <small>
                        {activeWallet.address} · {activeWallet.ens}
                      </small>
                    </div>
                  )}
                  {renderWalletStatusFeedback(activeWallet)}
                  {renderWalletConnectionActions(activeWallet)}
                </div>
                {renderQuoteReviewControls()}
                <Button
                  type="button"
                  className="checkout-desktop-confirm"
                  disabled={!canConfirm}
                  onClick={() => void confirmQuote()}
                >
                  {orderMutation.isPending ? 'Criando pedido...' : 'Confirmar compra'}
                </Button>
                <Link to="/cart">Voltar ao carrinho</Link>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
