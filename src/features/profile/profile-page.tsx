import { queryKeys } from '@/lib/query-keys';
import { useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { Activity, Eye, EyeOff, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { SiteHeader } from '@/features/catalog/components/site-header';
import { profileInputSchema, type Profile, type ProfileInput } from '@/contracts/profile';
import { normalizeApiError } from '@/lib/errors';
import { prepareProfileImage, ProfileImagePreparationError } from '@/lib/profile-image';
import { changePassword, getProfile, updateProfile, updateProfileEmail } from './api';

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return 'Sua sessão expirou. Entre novamente para continuar.';
    return (error.normalized ?? normalizeApiError(error)).message;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export function ProfilePage({ userId }: { userId: string }) {
  const profile = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => getProfile(signal),
    retry: false,
  });
  return (
    <div className="home-shell profile-shell mx-auto max-w-[1440px] px-16 pt-12 pb-16 max-[700px]:px-4 max-[700px]:pt-6 max-[700px]:pb-12">
      <SiteHeader />
      <main className="profile-layout mt-8 grid grid-cols-[310px_minmax(0,1fr)] items-start gap-8 max-[700px]:mt-0 max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-6">
        <AccountSidebar active="profile" />
        {profile.isPending ? (
          <div className="grid gap-6 *:h-[120px]" aria-label="Carregando perfil">
            <Skeleton />
            <Skeleton />
          </div>
        ) : profile.isError ? (
          <section className="grid justify-items-start gap-4" role="alert">
            <p>{errorMessage(profile.error)}</p>
            {axios.isAxiosError(profile.error) && profile.error.response?.status === 401 ? (
              <Link to="/login" search={{ redirect: '/account' }} className="text-primary">
                Entrar novamente
              </Link>
            ) : (
              <Button onClick={() => void profile.refetch()}>Tentar novamente</Button>
            )}
          </section>
        ) : (
          <ProfileForms key={userId} initial={profile.data} userId={userId} />
        )}
      </main>
    </div>
  );
}

function ProfileForms({ initial, userId }: { initial: Profile; userId: string }) {
  const client = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileInput>({
    displayName: initial.displayName,
    username: initial.username,
    ens: initial.ens,
    walletNickname: initial.walletNickname,
    avatar: initial.avatar,
  });
  const [formError, setFormError] = useState('');
  const [email, setEmail] = useState(initial.email);
  const [emailError, setEmailError] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmation: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isOptimizingAvatar, setIsOptimizingAvatar] = useState(false);
  const update = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
        client.invalidateQueries({ queryKey: queryKeys.session() }),
      ]);
    },
  });
  const password = useMutation({
    mutationFn: changePassword,
    onSuccess: () => setPasswords({ currentPassword: '', newPassword: '', confirmation: '' }),
  });
  const emailMutation = useMutation({
    mutationFn: updateProfileEmail,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
        client.invalidateQueries({ queryKey: queryKeys.session() }),
      ]);
    },
  });
  const set = (field: keyof ProfileInput, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
    update.reset();
  };
  const submitEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Informe um e-mail válido.');
      return;
    }
    emailMutation.mutate(email);
  };
  const avatarChange = async (file?: File) => {
    if (!file) return;
    setFormError('');
    setIsOptimizingAvatar(true);
    try {
      const image = await prepareProfileImage(file);
      set('avatar', image.dataUrl);
    } catch (error) {
      setFormError(
        error instanceof ProfileImagePreparationError
          ? error.message
          : 'Não foi possível otimizar a imagem.',
      );
    } finally {
      setIsOptimizingAvatar(false);
    }
  };
  return (
    <div className="profile-content">
      <h1 className="text-base font-bold">Perfil do colecionador</h1>
      <form
        className="mt-8 max-[700px]:mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = profileInputSchema.safeParse(form);
          if (!parsed.success) {
            setFormError('Confira o nome, o nome de usuário e a imagem.');
            return;
          }
          update.mutate(parsed.data);
        }}
      >
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-6 max-[700px]:grid-cols-[minmax(0,1fr)] max-[700px]:gap-4">
          <label className="block text-sm text-foreground">
            Nome de exibição <span className="text-destructive">*</span>
            <Input
              value={form.displayName}
              required
              minLength={2}
              maxLength={50}
              onChange={(event) => set('displayName', event.target.value)}
              className="mt-2"
            />
          </label>
          <label className="block text-sm text-foreground">
            Nome de usuário <span className="text-destructive">*</span>
            <Input
              value={form.username}
              required
              minLength={2}
              maxLength={50}
              onChange={(event) => set('username', event.target.value)}
              className="mt-2"
            />
          </label>
          <label className="block text-sm text-foreground">
            E-mail
            <Input
              type="email"
              value={email}
              autoComplete="email"
              aria-invalid={!!emailError || emailMutation.isError}
              aria-describedby="profile-email-help"
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError('');
                emailMutation.reset();
              }}
              onInput={(event) => {
                setEmail(event.currentTarget.value);
                setEmailError('');
                emailMutation.reset();
              }}
              className="mt-2"
            />
            <small id="profile-email-help" className="mt-2 block text-xs text-muted-foreground">
              Use um e-mail que ainda não pertença a outra conta.
            </small>
            <Button
              type="button"
              disabled={emailMutation.isPending}
              onClick={submitEmail}
              className="max-[700px]:mt-3 max-[700px]:w-full"
            >
              {emailMutation.isPending ? 'Atualizando e-mail...' : 'Atualizar e-mail'}
            </Button>
            {(emailError || emailMutation.isError) && (
              <span role="alert" className="mt-3 block text-sm text-destructive">
                {emailError || errorMessage(emailMutation.error)}
              </span>
            )}
            {emailMutation.isSuccess && (
              <span role="status" className="mt-3 block text-sm text-success">
                E-mail atualizado.
              </span>
            )}
          </label>
          <label className="block text-sm text-foreground">
            Nome ENS <span className="text-muted-foreground">(opcional)</span>
            <Input
              value={form.ens}
              maxLength={100}
              placeholder="nome.eth"
              onChange={(event) => set('ens', event.target.value)}
              className="mt-2"
            />
          </label>
          <label className="block text-sm text-foreground">
            Apelido da carteira <span className="text-muted-foreground">(opcional)</span>
            <Input
              value={form.walletNickname}
              maxLength={100}
              onChange={(event) => set('walletNickname', event.target.value)}
              className="mt-2"
            />
          </label>
          <div className="grid content-start gap-2 text-sm text-foreground">
            <span>Avatar</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid size-[50px] place-items-center overflow-hidden rounded-full bg-surface-raised text-primary-hover">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt="Avatar selecionado"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus size={24} aria-hidden="true" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  void avatarChange(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <Button
                type="button"
                disabled={isOptimizingAvatar}
                onClick={() => fileRef.current?.click()}
              >
                {isOptimizingAvatar ? 'Otimizando...' : 'Alterar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!form.avatar || isOptimizingAvatar}
                onClick={() => set('avatar', null)}
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
        {(formError || update.isError) && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {formError || errorMessage(update.error)}
          </p>
        )}
        {update.isSuccess && (
          <p role="status" className="mt-3 text-sm text-success">
            Perfil salvo.
          </p>
        )}
        <Button
          type="submit"
          disabled={update.isPending || isOptimizingAvatar}
          className="mt-6 max-[700px]:w-full"
        >
          {update.isPending ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </form>
      <form
        className="mt-12 grid max-w-[417px] gap-4 max-[700px]:mt-8 max-[700px]:max-w-full"
        onSubmit={(event) => {
          event.preventDefault();
          setPasswordError('');
          if (
            !passwords.currentPassword ||
            passwords.newPassword.length < 8 ||
            passwords.newPassword.length > 128
          ) {
            setPasswordError('Informe a senha atual e uma nova senha de 8 a 128 caracteres.');
            return;
          }
          if (passwords.newPassword !== passwords.confirmation) {
            setPasswordError('A confirmação da senha não corresponde.');
            return;
          }
          password.mutate({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          });
        }}
      >
        <h2 className="text-base font-bold">Alterar senha</h2>
        <PasswordField
          label="Senha atual"
          autoComplete="current-password"
          value={passwords.currentPassword}
          onChange={(value) => {
            setPasswords({ ...passwords, currentPassword: value });
            password.reset();
          }}
        />
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          value={passwords.newPassword}
          onChange={(value) => {
            setPasswords({ ...passwords, newPassword: value });
            password.reset();
          }}
        />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          value={passwords.confirmation}
          onChange={(value) => {
            setPasswords({ ...passwords, confirmation: value });
            password.reset();
          }}
        />
        {(passwordError || password.isError) && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {passwordError || errorMessage(password.error)}
          </p>
        )}
        {password.isSuccess && (
          <p role="status" className="mt-3 text-sm text-success">
            Senha alterada.
          </p>
        )}
        <Button
          type="submit"
          disabled={password.isPending}
          className="justify-self-start max-[700px]:w-full max-[700px]:justify-self-stretch"
        >
          {password.isPending ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </form>
      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity size={16} aria-hidden="true" /> Dados de demonstração; carteira, favoritos e
        outras áreas ainda estão em desenvolvimento.
      </p>
    </div>
  );
}

function PasswordField({
  label,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-foreground">
        {label}
      </label>
      <span className="relative block">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 pr-12"
        />
        <button
          type="button"
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 bottom-0 grid size-11 cursor-pointer place-items-center text-muted-foreground"
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </div>
  );
}
