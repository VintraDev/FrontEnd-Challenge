import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { SocialLogin } from './social-login';
import { login } from './api';
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

export function LoginPage({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState('');
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (session) => {
      await client.cancelQueries();
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      client.setQueryData(queryKeys.session(), session);
      await navigate({ href: safeRedirect(redirect), replace: true });
    },
  });
  const close = () => {
    void navigate({ to: '/', search: homeSearch });
  };
  const message = mutation.isError
    ? axios.isAxiosError(mutation.error) && mutation.error.response?.status === 401
      ? 'E-mail ou senha inválidos.'
      : 'Não foi possível entrar. Tente novamente.'
    : validation;
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
            <DialogTitle className="text-primary max-[700px]:text-lg max-[700px]:text-foreground">
              Entrar
            </DialogTitle>
            <Link
              className="hover:text-primary max-[700px]:hidden"
              to="/register"
              search={{ redirect }}
            >
              Criar conta
            </Link>
          </div>
          <DialogDescription className="mx-auto mt-8 mb-6 max-w-[340px] text-center text-sm text-muted-foreground max-[700px]:hidden">
            Entre para gerenciar sua carteira, coleções e NFTs.
          </DialogDescription>
          <form
            className="mx-auto grid max-w-[340px] gap-3 max-[700px]:max-w-[358px]"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              setValidation('');
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
                setValidation('Informe um e-mail válido e sua senha.');
                return;
              }
              mutation.mutate({ email: email.trim(), password });
            }}
          >
            <label htmlFor="login-email" className="sr-only">
              E-mail
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!validation}
              aria-describedby={message ? 'login-error' : undefined}
              className={authInputClass}
            />
            <div className="relative">
              <label htmlFor="login-password" className="sr-only">
                Senha
              </label>
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={!!validation}
                aria-describedby={message ? 'login-error' : undefined}
                className={`${authInputClass} pr-12 max-[700px]:pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground max-[700px]:right-1 max-[700px]:grid max-[700px]:size-11 max-[700px]:place-items-center"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {message && (
              <p id="login-error" className="text-sm text-destructive" role="alert">
                {message}
              </p>
            )}
            <span className="text-right text-xs text-muted-foreground">
              Recuperação de senha em breve
            </span>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="max-[700px]:mt-7 max-[700px]:min-h-[60px]"
            >
              {mutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <SocialLogin />
          <p className="hidden max-[700px]:mt-10 max-[700px]:block max-[700px]:text-center max-[700px]:text-sm max-[700px]:text-muted-foreground">
            Novo na Kurio?{' '}
            <Link to="/register" search={{ redirect }} className="text-primary">
              Crie uma conta
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
