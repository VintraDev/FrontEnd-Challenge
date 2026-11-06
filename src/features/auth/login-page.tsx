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
            <DialogTitle>Entrar</DialogTitle>
            <Link className="auth-desktop-switch" to="/register" search={{ redirect }}>
              Criar conta
            </Link>
          </div>
          <DialogDescription className="login-description">
            Entre para gerenciar sua carteira, coleções e NFTs.
          </DialogDescription>
          <form
            className="login-form"
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
            />
            <div className="login-password">
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
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {message && (
              <p id="login-error" className="login-error" role="alert">
                {message}
              </p>
            )}
            <span className="login-forgot">Recuperação de senha em breve</span>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <SocialLogin />
          <p className="auth-mobile-switch">
            Novo na Kurio?{' '}
            <Link to="/register" search={{ redirect }}>
              Crie uma conta
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
