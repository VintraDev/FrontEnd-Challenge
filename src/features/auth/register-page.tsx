import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registrationSchema, type Registration } from '@/contracts/auth';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { SocialLogin } from './social-login';
import { register } from './api';
import { safeRedirect } from './session';
import '@/features/catalog/home.css';
import './login.css';

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};
type Field = keyof Registration | 'confirmation';
type Errors = Partial<Record<Field, string>>;
export function RegisterPage({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [visible, setVisible] = useState(false);
  const [visibleConfirmation, setVisibleConfirmation] = useState(false);
  const mutation = useMutation({
    mutationFn: register,
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const fields: unknown = error.response.data?.error?.fieldErrors;
        if (fields && typeof fields === 'object') {
          const result: Errors = {};
          for (const field of ['name', 'email', 'password'] as const) {
            const value: unknown = (fields as Record<string, unknown>)[field];
            if (Array.isArray(value) && typeof value[0] === 'string') result[field] = value[0];
          }
          setErrors(result);
        }
      }
    },
    onSuccess: async (session) => {
      await client.cancelQueries();
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      client.setQueryData(queryKeys.session(), session);
      await navigate({ href: safeRedirect(redirect), replace: true });
    },
  });
  const update = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    mutation.reset();
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = registrationSchema.safeParse(values);
    const next: Errors = {};
    if (!result.success)
      for (const issue of result.error.issues) {
        const key = issue.path[0] as Field;
        next[key] ??= issue.message;
      }
    if (!values.confirmation || values.password !== values.confirmation)
      next.confirmation = 'As senhas devem ser iguais.';
    setErrors(next);
    if (result.success && !next.confirmation && !mutation.isPending) mutation.mutate(result.data);
  };
  const conflict = axios.isAxiosError(mutation.error) && mutation.error.response?.status === 409;
  const serverError = mutation.isError
    ? conflict
      ? 'Este e-mail já está cadastrado. Entre na sua conta.'
      : 'Não foi possível criar sua conta. Tente novamente.'
    : '';
  const close = () => {
    void navigate({ to: '/', search: homeSearch });
  };
  return (
    <>
      <div className="home-shell login-background">
        <SiteHeader />
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Bem-vindo à Kurio</p>
            <h1>SEJA DONO DO FUTURO DA ARTE DIGITAL</h1>
            <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
          </div>
          <img src="/assets/nfts/image-import-1.webp" alt="" width={640} height={640} />
        </section>
      </div>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) close();
        }}
      >
        <DialogContent
          className="login-dialog"
          onEscapeKeyDown={(event) => {
            if (mutation.isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (mutation.isPending) event.preventDefault();
          }}
        >
          <div className="auth-mobile-logo" aria-hidden="true">
            KURIO
          </div>
          <div className="login-tabs">
            <Link
              className="auth-desktop-switch"
              to="/login"
              search={{ redirect }}
              onClick={(event) => {
                if (mutation.isPending) event.preventDefault();
              }}
            >
              Entrar
            </Link>
            <DialogTitle>
              <span className="auth-desktop-title">Criar conta</span>
              <span className="auth-mobile-title">Criar perfil de colecionador</span>
            </DialogTitle>
          </div>
          <DialogDescription className="login-description">
            Crie seu perfil de colecionador e conecte uma carteira quando quiser.
          </DialogDescription>
          <form className="login-form" noValidate onSubmit={submit}>
            <div>
              <label htmlFor="register-name" className="sr-only">
                Nome de usuário
              </label>
              <Input
                disabled={mutation.isPending}
                id="register-name"
                autoComplete="nickname"
                placeholder="Nome de usuário"
                value={values.name}
                onChange={(event) => update('name', event.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'register-name-error' : undefined}
              />
              {errors.name && (
                <p id="register-name-error" className="login-error">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="register-email" className="sr-only">
                E-mail
              </label>
              <Input
                disabled={mutation.isPending}
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="Digite seu e-mail"
                value={values.email}
                onChange={(event) => update('email', event.target.value)}
                aria-invalid={!!errors.email || conflict}
                aria-describedby={
                  errors.email
                    ? 'register-email-error'
                    : conflict
                      ? 'register-server-error'
                      : undefined
                }
              />
              {errors.email && (
                <p id="register-email-error" className="login-error">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <div className="login-password">
                <label htmlFor="register-password" className="sr-only">
                  Senha
                </label>
                <Input
                  disabled={mutation.isPending}
                  id="register-password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Senha"
                  value={values.password}
                  onChange={(event) => update('password', event.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'register-password-error' : undefined}
                />
                <button
                  type="button"
                  disabled={mutation.isPending}
                  aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p id="register-password-error" className="login-error">
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <div className="login-password">
                <label htmlFor="register-confirmation" className="sr-only">
                  Confirmar senha
                </label>
                <Input
                  disabled={mutation.isPending}
                  id="register-confirmation"
                  type={visibleConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirmar senha"
                  value={values.confirmation}
                  onChange={(event) => update('confirmation', event.target.value)}
                  aria-invalid={!!errors.confirmation}
                  aria-describedby={errors.confirmation ? 'register-confirmation-error' : undefined}
                />
                <button
                  type="button"
                  disabled={mutation.isPending}
                  aria-label={
                    visibleConfirmation
                      ? 'Ocultar confirmação de senha'
                      : 'Mostrar confirmação de senha'
                  }
                  onClick={() => setVisibleConfirmation(!visibleConfirmation)}
                >
                  {visibleConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmation && (
                <p id="register-confirmation-error" className="login-error">
                  {errors.confirmation}
                </p>
              )}
            </div>
            {serverError && (
              <p id="register-server-error" className="login-error" role="alert">
                {serverError}
              </p>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                'Criando conta...'
              ) : (
                <>
                  <span className="auth-desktop-title">Criar conta</span>
                  <span className="auth-mobile-title">Criar perfil</span>
                </>
              )}
            </Button>
          </form>
          <SocialLogin />
          <p className="auth-mobile-switch">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              search={{ redirect }}
              onClick={(event) => {
                if (mutation.isPending) event.preventDefault();
              }}
            >
              Entre
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
