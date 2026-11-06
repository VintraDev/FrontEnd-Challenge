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

const homeSearch = {
  q: '',
  categories: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sort: 'recent' as const,
  page: 1,
};

const authInputClass = 'min-h-10 max-[700px]:min-h-[50px] max-[700px]:rounded-md max-[700px]:px-4';
const passwordToggleClass =
  'absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground max-[700px]:right-1 max-[700px]:grid max-[700px]:size-11 max-[700px]:place-items-center';

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
      <div className="home-shell login-background mx-auto max-w-[1440px] px-16 pt-12 pb-16 max-[700px]:hidden">
        <SiteHeader />
        <section className="hero mt-(--space-section) grid grid-cols-[1fr_minmax(320px,540px)] items-center gap-8">
          <div className="hero-copy">
            <p className="text-sm leading-(--line-height-label) font-semibold tracking-(--letter-spacing-eyebrow) text-primary uppercase">
              Bem-vindo à Kurio
            </p>
            <h1 className="mt-3 text-display leading-(--line-height-heading) font-bold">
              SEJA DONO DO FUTURO DA ARTE DIGITAL
            </h1>
            <p className="mt-4 text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
          </div>
          <img
            src="/assets/nfts/image-import-1.webp"
            alt=""
            width={640}
            height={640}
            className="aspect-square w-full border border-border bg-surface object-cover p-3"
          />
        </section>
      </div>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) close();
        }}
      >
        <DialogContent
          className="login-dialog border-b-[10px] border-primary-hover px-8 pt-12 pb-8 max-[700px]:inset-0 max-[700px]:h-dvh max-[700px]:max-h-none max-[700px]:w-full max-[700px]:translate-x-0 max-[700px]:translate-y-0 max-[700px]:border-0 max-[700px]:bg-background max-[700px]:px-6 max-[700px]:pt-[calc(var(--space-16)+var(--space-4)+env(safe-area-inset-top))] max-[700px]:pb-[calc(var(--space-6)+env(safe-area-inset-bottom))]"
          onEscapeKeyDown={(event) => {
            if (mutation.isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (mutation.isPending) event.preventDefault();
          }}
        >
          <div
            className="hidden max-[700px]:mb-10 max-[700px]:grid max-[700px]:h-[136px] max-[700px]:place-items-center max-[700px]:text-2xl max-[700px]:font-bold max-[700px]:tracking-[0.1em] max-[700px]:text-foreground"
            aria-hidden="true"
          >
            KURIO
          </div>
          <div className="flex justify-center gap-6 font-bold max-[700px]:mb-10 max-[700px]:text-center">
            <Link
              className="hover:text-primary max-[700px]:hidden"
              to="/login"
              search={{ redirect }}
              onClick={(event) => {
                if (mutation.isPending) event.preventDefault();
              }}
            >
              Entrar
            </Link>
            <DialogTitle className="text-primary max-[700px]:text-lg max-[700px]:text-foreground">
              <span className="max-[700px]:hidden">Criar conta</span>
              <span className="hidden max-[700px]:inline">Criar perfil de colecionador</span>
            </DialogTitle>
          </div>
          <DialogDescription className="mx-auto mt-8 mb-6 max-w-[340px] text-center text-sm text-muted-foreground max-[700px]:hidden">
            Crie seu perfil de colecionador e conecte uma carteira quando quiser.
          </DialogDescription>
          <form
            className="mx-auto grid max-w-[340px] gap-3 max-[700px]:max-w-[358px]"
            noValidate
            onSubmit={submit}
          >
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
                className={authInputClass}
              />
              {errors.name && (
                <p id="register-name-error" className="text-sm text-destructive">
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
                className={authInputClass}
              />
              {errors.email && (
                <p id="register-email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <div className="relative">
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
                  className={`${authInputClass} pr-12 max-[700px]:pr-12`}
                />
                <button
                  type="button"
                  disabled={mutation.isPending}
                  aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setVisible(!visible)}
                  className={passwordToggleClass}
                >
                  {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p id="register-password-error" className="text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <div className="relative">
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
                  className={`${authInputClass} pr-12 max-[700px]:pr-12`}
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
                  className={passwordToggleClass}
                >
                  {visibleConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmation && (
                <p id="register-confirmation-error" className="text-sm text-destructive">
                  {errors.confirmation}
                </p>
              )}
            </div>
            {serverError && (
              <p id="register-server-error" className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="max-[700px]:mt-7 max-[700px]:min-h-[60px]"
            >
              {mutation.isPending ? (
                'Criando conta...'
              ) : (
                <>
                  <span className="max-[700px]:hidden">Criar conta</span>
                  <span className="hidden max-[700px]:inline">Criar perfil</span>
                </>
              )}
            </Button>
          </form>
          <SocialLogin />
          <p className="hidden max-[700px]:mt-10 max-[700px]:block max-[700px]:text-center max-[700px]:text-sm max-[700px]:text-muted-foreground">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              search={{ redirect }}
              onClick={(event) => {
                if (mutation.isPending) event.preventDefault();
              }}
              className="text-primary"
            >
              Entre
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
