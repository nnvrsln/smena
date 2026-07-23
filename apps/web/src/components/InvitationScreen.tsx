import type { InvitationPreviewResponse } from '@smena/contracts'
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, HardHat, LoaderCircle, LockKeyhole, Phone, ShieldCheck, UserRound, Users } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { loadInvitation, registerInvitation } from '../api/context'
import { Brand } from './Brand'

const roleLabels = { worker: 'Рабочий', foreman: 'Бригадир' } as const

export function InvitationScreen({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [preview, setPreview] = useState<InvitationPreviewResponse | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'complete'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [noMiddleName, setNoMiddleName] = useState(false)
  const [form, setForm] = useState({ lastName: '', firstName: '', middleName: '', specialization: '', phone: '+7 ', password: '', confirm: '' })

  useEffect(() => {
    const controller = new AbortController()
    loadInvitation(token, controller.signal)
      .then((data) => { setPreview(data); setState('ready') })
      .catch((reason: unknown) => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : 'Ссылка недействительна.'); setState('invalid') } })
    return () => controller.abort()
  }, [token])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (form.password !== form.confirm) { setError('Пароли не совпадают.'); return }
    if (!noMiddleName && form.middleName.trim().length < 2) { setError('Укажите отчество или отметьте, что его нет.'); return }
    setSubmitting(true)
    setError(null)
    try {
      await registerInvitation(token, {
        lastName: form.lastName, firstName: form.firstName,
        ...(noMiddleName ? {} : { middleName: form.middleName }),
        specialization: form.specialization, phone: form.phone, password: form.password,
      })
      setState('complete')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось завершить регистрацию.')
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'loading') return <main className="invite-screen"><section className="invite-state"><LoaderCircle className="spin" /><h1>Проверяем приглашение</h1><p>Сверяем организацию, роль и срок действия.</p></section></main>
  if (state === 'invalid') return <main className="invite-screen"><section className="invite-state is-error"><AlertTriangle /><h1>Приглашение недоступно</h1><p>{error}</p><button type="button" onClick={() => { window.history.replaceState({}, '', '/'); onComplete() }}>Перейти ко входу</button></section></main>
  if (state === 'complete') return <main className="invite-screen"><section className="invite-state is-complete"><CheckCircle2 /><h1>Профиль создан</h1><p>Вы уже вошли в «Смену». Назначенные объекты и роль получены с сервера.</p><button type="button" onClick={() => { window.history.replaceState({}, '', '/'); onComplete() }}>Открыть кабинет<ArrowRight size={18} /></button></section></main>
  if (!preview) return null

  return <main className="invite-screen">
    <section className="invite-shell">
      <aside className="invite-context">
        <Brand />
        <div className="invite-context__copy"><span>Персональное приглашение</span><h1>Ваша площадка уже готова.</h1><p>Заполните профиль — роль и доступ к объектам будут назначены автоматически.</p></div>
        <div className="invite-pass">
          <header><span>{preview.role === 'foreman' ? <HardHat /> : <Users />}</span><div><small>Роль</small><b>{roleLabels[preview.role]}</b></div></header>
          <section><small>Организация</small><b>{preview.organization.name}</b></section>
          <div>{preview.objects.map((object) => <span key={object.id}><Building2 size={16} /><b>{object.name}</b><small>{object.code}</small></span>)}</div>
          <footer><ShieldCheck size={15} />Ссылка одноразовая · до {new Date(preview.expiresAt).toLocaleDateString('ru-RU')}</footer>
        </div>
      </aside>
      <div className="invite-form">
        <header><span><UserRound /></span><div><small>Новый сотрудник</small><h2>Создайте профиль</h2><p>Эти данные будут видны вашей рабочей команде.</p></div></header>
        <form onSubmit={submit}>
          <div className="invite-form__names">
            <label><span>Фамилия</span><input required autoComplete="family-name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
            <label><span>Имя</span><input required autoComplete="given-name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
          </div>
          <label><span>Отчество</span><input disabled={noMiddleName} required={!noMiddleName} autoComplete="additional-name" value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} /></label>
          <label className="invite-check"><input type="checkbox" checked={noMiddleName} onChange={(event) => setNoMiddleName(event.target.checked)} /><span>Нет отчества</span></label>
          <label><span>Специализация</span><input required placeholder={preview.role === 'foreman' ? 'Например, общестроительные работы' : 'Например, монтажник'} value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} /></label>
          <label><span>Телефон — будущий логин</span><div><Phone size={17} /><input required inputMode="tel" autoComplete="username" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div></label>
          <label><span>Пароль</span><div><LockKeyhole size={17} /><input required minLength={8} autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <label><span>Повторите пароль</span><div><LockKeyhole size={17} /><input required minLength={8} autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} /></div></label>
          {error ? <p className="invite-error" role="alert">{error}</p> : null}
          <button className="invite-submit" type="submit" disabled={submitting}><span>{submitting ? 'Создаём профиль…' : 'Завершить регистрацию'}</span>{submitting ? <LoaderCircle className="spin" /> : <ArrowRight />}</button>
        </form>
      </div>
    </section>
  </main>
}
