import type { InvitationSummary, ObjectSummary } from '@smena/contracts'
import { AlertTriangle, Building2, CheckCircle2, Clipboard, Clock3, Link2, LoaderCircle, Trash2, UserPlus, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { createInvitation, loadInvitations, revokeInvitation } from '../api/context'

const roleLabels = { worker: 'Рабочий', foreman: 'Бригадир' } as const

export function InvitationManager({ objects, onClose }: { objects: ObjectSummary[]; onClose: () => void }) {
  const [role, setRole] = useState<'worker' | 'foreman'>('worker')
  const [objectIds, setObjectIds] = useState<string[]>(objects[0] ? [objects[0].id] : [])
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [internalNote, setInternalNote] = useState('')
  const [invitations, setInvitations] = useState<InvitationSummary[]>([])
  const [link, setLink] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    loadInvitations(controller.signal)
      .then(({ invitations: data }) => { setInvitations(data); setStatus('ready') })
      .catch((reason: unknown) => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить приглашения.'); setStatus('ready') } })
    return () => controller.abort()
  }, [])

  const toggleObject = (id: string) => setObjectIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setError(null)
    setLink(null)
    try {
      const response = await createInvitation({ role, objectIds, expiresInDays, ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {}) })
      setInvitations((current) => [response.invitation, ...current])
      const invitationPath = new URL(response.link).pathname
      setLink(new URL(invitationPath, window.location.origin).toString())
      setInternalNote('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось создать приглашение.')
    } finally {
      setStatus('ready')
    }
  }

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function revoke(id: string) {
    setError(null)
    try {
      await revokeInvitation(id)
      setInvitations((current) => current.map((item) => item.id === id ? { ...item, status: 'revoked' } : item))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось отозвать приглашение.')
    }
  }

  return <div className="invite-manager-backdrop">
    <aside className="invite-manager" role="dialog" aria-modal="true" aria-labelledby="invite-manager-title">
      <header><div><span>Доступ к организации</span><h2 id="invite-manager-title">Пригласить сотрудника</h2><p>Создайте персональную одноразовую ссылку.</p></div><button type="button" onClick={onClose} aria-label="Закрыть"><X /></button></header>
      <div className="invite-manager__layout">
        <form onSubmit={submit}>
          <fieldset><legend>Роль сотрудника</legend><div className="invite-manager__roles"><button className={role === 'worker' ? 'is-selected' : ''} type="button" onClick={() => setRole('worker')}><UserPlus /><span><b>Рабочий</b><small>Смена и свои задачи</small></span></button><button className={role === 'foreman' ? 'is-selected' : ''} type="button" onClick={() => setRole('foreman')}><Clipboard /><span><b>Бригадир</b><small>Команда и контроль</small></span></button></div></fieldset>
          <fieldset><legend>Доступные объекты</legend><div className="invite-manager__objects">{objects.map((object) => <button className={objectIds.includes(object.id) ? 'is-selected' : ''} type="button" onClick={() => toggleObject(object.id)} key={object.id}><span>{objectIds.includes(object.id) ? <CheckCircle2 /> : <Building2 />}</span><b>{object.name}</b><small>{object.code}</small></button>)}</div></fieldset>
          <div className="invite-manager__fields"><label><span>Срок</span><select value={expiresInDays} onChange={(event) => setExpiresInDays(Number(event.target.value))}><option value={1}>1 день</option><option value={3}>3 дня</option><option value={7}>7 дней</option><option value={14}>14 дней</option></select></label><label><span>Внутренний комментарий</span><input maxLength={240} placeholder="Например, монтажная бригада" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /></label></div>
          {error ? <p className="invite-manager__error"><AlertTriangle />{error}</p> : null}
          <button className="invite-manager__submit" type="submit" disabled={status === 'saving' || objectIds.length === 0}>{status === 'saving' ? <LoaderCircle className="spin" /> : <Link2 />}<span>{status === 'saving' ? 'Создаём ссылку…' : 'Создать приглашение'}</span></button>
          {link ? <section className="invite-manager__link"><span><CheckCircle2 />Ссылка готова</span><code>{link}</code><button type="button" onClick={copyLink}>{copied ? <CheckCircle2 /> : <Clipboard />}{copied ? 'Скопировано' : 'Скопировать ссылку'}</button></section> : null}
        </form>
        <section className="invite-manager__history"><header><div><span>Последние ссылки</span><b>{invitations.length}</b></div><p>Токен показывается только один раз — сразу после создания.</p></header>{status === 'loading' ? <div className="invite-manager__empty"><LoaderCircle className="spin" />Загружаем</div> : invitations.length ? <div>{invitations.map((invitation) => {
          const objectNames = objects.filter((object) => invitation.objectIds.includes(object.id)).map((object) => object.name)
          return <article key={invitation.id}><span className={`is-${invitation.status}`}><i />{invitation.status === 'active' ? 'Активна' : invitation.status === 'used' ? 'Использована' : invitation.status === 'expired' ? 'Истекла' : 'Отозвана'}</span><h3>{roleLabels[invitation.role]}</h3><p>{objectNames.join(', ') || 'Объекты недоступны'}</p><footer><span><Clock3 />до {new Date(invitation.expiresAt).toLocaleDateString('ru-RU')}</span>{invitation.status === 'active' ? <button type="button" onClick={() => revoke(invitation.id)}><Trash2 />Отозвать</button> : null}</footer></article>
        })}</div> : <div className="invite-manager__empty"><Link2 />Приглашений пока нет</div>}</section>
      </div>
    </aside>
  </div>
}
