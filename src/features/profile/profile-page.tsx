import { queryKeys } from '@/lib/query-keys'
import { useId, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import axios from 'axios'
import { Activity, Eye, EyeOff, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { SiteHeader } from '@/features/catalog/components/site-header'
import { profileInputSchema, type Profile, type ProfileInput } from '@/contracts/profile'
import { changePassword, getProfile, updateProfile } from './api'
import '@/features/catalog/home.css'
import './profile.css'

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.'
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function ProfilePage({ userId }: { userId: string }) {
  const profile = useQuery({ queryKey: queryKeys.profile(userId), queryFn: ({ signal }) => getProfile(signal), retry: false })
  return <div className="home-shell profile-shell"><SiteHeader /><main className="profile-layout"><AccountSidebar active="profile" />
    {profile.isPending ? <div className="profile-loading" aria-label="Carregando perfil"><Skeleton /><Skeleton /></div> : profile.isError ? <section className="profile-feedback" role="alert"><p>{errorMessage(profile.error)}</p>{axios.isAxiosError(profile.error) && profile.error.response?.status === 401 ? <Link to="/login" search={{ redirect: '/account' }}>Entrar novamente</Link> : <Button onClick={() => void profile.refetch()}>Tentar novamente</Button>}</section> : <ProfileForms key={userId} initial={profile.data} userId={userId} />}
  </main></div>
}

function ProfileForms({ initial, userId }: { initial: Profile; userId: string }) {
  const client = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProfileInput>({ displayName: initial.displayName, username: initial.username, ens: initial.ens, walletNickname: initial.walletNickname, avatar: initial.avatar })
  const [formError, setFormError] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
  const [passwordError, setPasswordError] = useState('')
  const update = useMutation({ mutationFn: updateProfile, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.profile(userId) }), client.invalidateQueries({ queryKey: queryKeys.session() })]) } })
  const password = useMutation({ mutationFn: changePassword, onSuccess: () => setPasswords({ currentPassword: '', newPassword: '', confirmation: '' }) })
  const set = (field: keyof ProfileInput, value: string | null) => { setForm((current) => ({ ...current, [field]: value })); setFormError(''); update.reset() }
  const avatarChange = (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 500000) { setFormError('Escolha uma imagem PNG, JPEG ou WebP de até 500 KB.'); return }
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') set('avatar', reader.result) }
    reader.onerror = () => setFormError('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }
  return <div className="profile-content"><h1>Perfil do colecionador</h1><form className="profile-form" onSubmit={(event) => { event.preventDefault(); const parsed = profileInputSchema.safeParse(form); if (!parsed.success) { setFormError('Confira o nome, o nome de usuário e a imagem.'); return } update.mutate(parsed.data) }}><div className="profile-fields"><label>Nome de exibição <span>*</span><Input value={form.displayName} required minLength={2} maxLength={50} onChange={(event) => set('displayName', event.target.value)} /></label><label>Nome de usuário <span>*</span><Input value={form.username} required minLength={2} maxLength={50} onChange={(event) => set('username', event.target.value)} /></label><label>E-mail<Input type="email" value={initial.email} readOnly aria-describedby="profile-email-help" /><small id="profile-email-help">A alteração de e-mail ainda não está disponível.</small></label><label>Nome ENS <span className="profile-optional">(opcional)</span><Input value={form.ens} maxLength={100} placeholder="nome.eth" onChange={(event) => set('ens', event.target.value)} /></label><label>Apelido da carteira <span className="profile-optional">(opcional)</span><Input value={form.walletNickname} maxLength={100} onChange={(event) => set('walletNickname', event.target.value)} /></label><div className="profile-avatar"><span>Avatar</span><div className="profile-avatar-actions"><div className="profile-avatar-image">{form.avatar ? <img src={form.avatar} alt="Avatar selecionado" /> : <ImagePlus size={24} aria-hidden="true" />}</div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} onChange={(event) => { avatarChange(event.target.files?.[0]); event.target.value = '' }} /><Button type="button" onClick={() => fileRef.current?.click()}>Alterar</Button><Button type="button" variant="outline" disabled={!form.avatar} onClick={() => set('avatar', null)}>Remover</Button></div><small>PNG, JPEG ou WebP, até 500 KB.</small></div></div>{(formError || update.isError) && <p className="profile-error" role="alert">{formError || errorMessage(update.error)}</p>}{update.isSuccess && <p role="status">Perfil salvo.</p>}<Button type="submit" disabled={update.isPending}>{update.isPending ? 'Salvando...' : 'Salvar perfil'}</Button></form>
    <form className="profile-password" onSubmit={(event) => { event.preventDefault(); setPasswordError(''); if (!passwords.currentPassword || passwords.newPassword.length < 8 || passwords.newPassword.length > 128) { setPasswordError('Informe a senha atual e uma nova senha de 8 a 128 caracteres.'); return } if (passwords.newPassword !== passwords.confirmation) { setPasswordError('A confirmação da senha não corresponde.'); return } password.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) }}><h2>Alterar senha</h2><PasswordField label="Senha atual" autoComplete="current-password" value={passwords.currentPassword} onChange={(value) => { setPasswords({ ...passwords, currentPassword: value }); password.reset() }} /><PasswordField label="Nova senha" autoComplete="new-password" value={passwords.newPassword} onChange={(value) => { setPasswords({ ...passwords, newPassword: value }); password.reset() }} /><PasswordField label="Confirmar nova senha" autoComplete="new-password" value={passwords.confirmation} onChange={(value) => { setPasswords({ ...passwords, confirmation: value }); password.reset() }} />{(passwordError || password.isError) && <p className="profile-error" role="alert">{passwordError || errorMessage(password.error)}</p>}{password.isSuccess && <p role="status">Senha alterada.</p>}<Button type="submit" disabled={password.isPending}>{password.isPending ? 'Alterando...' : 'Alterar senha'}</Button></form>
    <p className="profile-note"><Activity size={16} aria-hidden="true" /> Dados de demonstração; carteira, favoritos e outras áreas ainda estão em desenvolvimento.</p>
  </div>
}

function PasswordField({ label, autoComplete, value, onChange }: { label: string; autoComplete: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return <div className="profile-password-field"><label htmlFor={id}>{label}</label><span className="profile-password-control"><Input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} /><button type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></span></div>
}
