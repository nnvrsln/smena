import { ArrowRight, Building2, Eye, EyeOff, HardHat, LockKeyhole, Phone, ShieldCheck, Users } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { login } from '../api/context'
import { Brand } from './Brand'

const demoAccounts = [
  { label: 'Подрядчик', phone: '+7 999 000-00-01', icon: Building2 },
  { label: 'Бригадир', phone: '+7 999 000-00-02', icon: HardHat },
  { label: 'Рабочий', phone: '+7 999 000-00-03', icon: Users },
] as const

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState('+7 999 000-00-01')
  const [password, setPassword] = useState('Smena2026!')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recoveryOpen, setRecoveryOpen] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login({ phone, password })
      onSuccess()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось войти.')
    } finally {
      setSubmitting(false)
    }
  }

  function selectDemo(nextPhone: string) {
    setPhone(nextPhone)
    setPassword('Smena2026!')
    setError(null)
  }

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <aside className="auth-story">
          <div className="auth-story__top"><Brand /><span><i /> Система готова к работе</span></div>
          <div className="auth-story__copy"><span className="auth-kicker">Единый рабочий контур</span><h1>Стройка движется.<br />Данные не теряются.</h1><p>Смена связывает подрядчика, бригадира и рабочего в одном защищённом пространстве.</p></div>
          <div className="auth-story__stats"><div><strong>3</strong><span>роли в одной системе</span></div><div><strong>24/7</strong><span>контроль рабочего дня</span></div></div>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel__mobile-brand"><Brand /></div>
          <header><span className="auth-lock"><LockKeyhole size={22} /></span><div><small>Защищённый вход</small><h2>Добро пожаловать</h2><p>Введите телефон и пароль, указанные при регистрации.</p></div></header>
          <form onSubmit={submit}>
            <label className="auth-field"><span>Номер телефона</span><div><Phone size={18} /><input autoComplete="username" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} aria-invalid={Boolean(error)} /></div></label>
            <label className="auth-field"><span>Пароль</span><div><LockKeyhole size={18} /><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <div className="auth-form-row"><span><ShieldCheck size={15} /> Сессия защищена</span><button type="button" onClick={() => setRecoveryOpen((value) => !value)}>Забыли пароль?</button></div>
            {recoveryOpen ? <div className="auth-recovery">На пилоте доступ восстанавливает ваш подрядчик. Свяжитесь с ним, чтобы получить одноразовую ссылку.</div> : null}
            <button className="auth-submit" type="submit" disabled={submitting}><span>{submitting ? 'Проверяем данные…' : 'Войти в Смену'}</span><ArrowRight size={19} /></button>
          </form>
          <section className="demo-access"><header><span>Быстрый вход для проверки</span><i>DEV</i></header><div>{demoAccounts.map(({ label, phone: demoPhone, icon: Icon }) => <button type="button" className={phone === demoPhone ? 'is-selected' : ''} onClick={() => selectDemo(demoPhone)} key={label}><Icon size={17} /><span>{label}</span></button>)}</div><small>Пароль уже заполнен. Выберите роль и нажмите «Войти».</small></section>
          <footer>Продолжая, вы подтверждаете доступ к рабочим данным своей организации.</footer>
        </div>
      </section>
    </main>
  )
}
