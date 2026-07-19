import type { MeContextResponse, MemberSummary, NavigationKey, ObjectSummary, Role } from '@smena/contracts'
import {
  AlertTriangle, ArrowUpRight, BarChart3, Bell, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardList, Clock3, Download, FileText, HardHat, Home,
  LoaderCircle, LogOut, Menu, MessageCircle, MoreHorizontal, Phone, Plus, Search, Settings, SlidersHorizontal, Users, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadCurrentShift, loadMembers, startShift, updateMemberObjects } from '../api/context'
import { Brand } from './Brand'

const navigationIcons: Record<NavigationKey, LucideIcon> = {
  overview: Home, objects: Building2, team: Users, tasks: ClipboardList,
  timesheet: Clock3, reports: BarChart3, today: Home, messages: MessageCircle, profile: Settings,
}

const roleLabels = { contractor: 'Подрядчик', foreman: 'Бригадир', worker: 'Рабочий' } as const

const objectVisuals = [
  { tone: 'blue', background: '/graphics/backgrounds/object-residential-3d-v2.webp' },
  { tone: 'cyan', background: '/graphics/backgrounds/object-business-3d-v2.webp' },
  { tone: 'orange', background: '/graphics/backgrounds/object-school-3d-v2.webp' },
] as const

export function RoleWorkspace({ context, onLogout }: { context: MeContextResponse; onLogout: () => void }) {
  if (context.user.role === 'contractor') return <ContractorWorkspace context={context} onLogout={onLogout} />
  if (context.user.role === 'foreman') return <MobileSessionWorkspace context={context} kind="foreman" onLogout={onLogout} />
  return <MobileSessionWorkspace context={context} kind="worker" onLogout={onLogout} />
}

function ContractorWorkspace({ context, onLogout }: { context: MeContextResponse; onLogout: () => void }) {
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'team'>('overview')
  const peoplePresent = context.objects.reduce((sum, object) => sum + object.presentWorkers, 0)
  const peoplePlanned = context.objects.reduce((sum, object) => sum + object.plannedWorkers, 0)
  const issueCount = context.objects.reduce((sum, object) => sum + object.issueCount, 0)
  const averageProgress = Math.round(context.objects.reduce((sum, object) => sum + object.dayProgress, 0) / Math.max(context.objects.length, 1))
  const workingNow = Math.max(peoplePresent - Math.round(peoplePresent * .14), 0)
  const filteredObjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    return query ? context.objects.filter((object) => `${object.name} ${object.code}`.toLocaleLowerCase('ru-RU').includes(query)) : context.objects
  }, [context.objects, search])
  const attentionObjects = context.objects.filter((object) => object.issueCount > 0)
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2600)
  }

  const metrics = [
    { label: 'Люди на смене', value: peoplePresent, suffix: `из ${peoplePlanned} по плану`, detail: 'Фактически вышли на объекты', note: `${Math.round(peoplePresent / Math.max(peoplePlanned, 1) * 100)}% явки`, badge: `${Math.round(peoplePresent / Math.max(peoplePlanned, 1) * 100)}% явки`, progress: Math.round(peoplePresent / Math.max(peoplePlanned, 1) * 100), tone: 'blue', icon: Users, background: '/graphics/backgrounds/metric-workforce-3d.webp' },
    { label: 'Сейчас в работе', value: workingNow, suffix: 'человек', detail: 'Выполняют назначенные задачи', note: `${peoplePresent - workingNow} на паузе или без задачи`, badge: `${Math.round(workingNow / Math.max(peoplePresent, 1) * 100)}% заняты`, progress: Math.round(workingNow / Math.max(peoplePresent, 1) * 100), tone: 'green', icon: HardHat, background: '/graphics/backgrounds/metric-active-work-3d.webp' },
    { label: 'План дня', value: `${averageProgress}%`, suffix: 'средний прогресс', detail: 'По доступным объектам', note: `${context.objects.length} объекта в расчёте`, badge: `${averageProgress}% готово`, progress: averageProgress, tone: 'violet', icon: ClipboardList, background: '/graphics/backgrounds/metric-tasks-3d.webp' },
    { label: 'Требует внимания', value: issueCount, suffix: issueCount === 1 ? 'событие' : 'события', detail: 'Нужны решения подрядчика', note: attentionObjects.length ? `${attentionObjects.length} объекта с вопросами` : 'Блокировок нет', badge: 'Приоритет', progress: null, tone: 'orange', icon: AlertTriangle, background: '/graphics/backgrounds/metric-attention-3d.webp' },
  ] as const

  return (
    <section className="contractor-shell" aria-label="Кабинет подрядчика">
      <aside className="contractor-sidebar">
        <Brand />
        <div className="contractor-sidebar__object"><span>Организация</span><button type="button" onClick={() => notify('Переключение организаций появится в F02')}><span className="object-mini-logo">{context.organization.name.slice(0, 2).toUpperCase()}</span><span><b>{context.organization.name}</b><small>{context.objects.length} активных объекта</small></span><ChevronDown size={16} /></button></div>
        <nav aria-label="Кабинет подрядчика">{context.navigation.map((item) => { const Icon = navigationIcons[item.key]; const available = item.key === 'overview' || item.key === 'team'; return <button type="button" className={activeSection === item.key ? 'is-active' : ''} onClick={() => { if (available) { setActiveSection(item.key as 'overview' | 'team'); setSearch('') } else notify(`${item.label}: следующий экран production-карты`) }} key={item.key}><Icon size={19} strokeWidth={2.1} /><span>{item.label}</span>{item.key === 'tasks' && issueCount ? <small>{issueCount}</small> : null}</button> })}</nav>
        <div className="contractor-sidebar__footer"><button type="button" onClick={() => notify('Настройки будут подключены отдельным срезом')}><Settings size={19} />Настройки</button><div className="contractor-profile"><span className="contractor-avatar">{context.user.initials}</span><span><b>{context.user.displayName}</b><small>Подрядчик</small></span><button type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={18} /></button></div></div>
      </aside>

      <div className="contractor-workspace">
        <header className="contractor-topbar">
          <button className="contractor-menu" type="button" aria-label="Открыть меню" onClick={() => notify('Меню разделов')}><Menu size={21} /></button><div className="contractor-mobile-brand"><Brand compact /></div>
          <label className="contractor-search"><Search size={18} /><input aria-label="Поиск" placeholder={activeSection === 'team' ? 'Найти сотрудника' : 'Найти объект'} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="contractor-topbar__actions"><button className="contractor-date" type="button" onClick={() => notify('Показываем оперативные данные за сегодня')}><CalendarDays size={17} />Сегодня<ChevronDown size={15} /></button><button className="contractor-icon-button" type="button" aria-label="Уведомления" onClick={() => notify(`${issueCount} событий требуют внимания`)}><Bell size={20} />{issueCount ? <i>{issueCount}</i> : null}</button><button className="contractor-create" type="button" onClick={() => notify('Создание задачи начнётся в S01')}><Plus size={19} /><span>Новая задача</span></button></div>
        </header>

        <div className="contractor-content">
          {activeSection === 'team' ? <ContractorTeamView context={context} search={search} notify={notify} /> : <>
          <section className="contractor-welcome"><div><span>Оперативная сводка</span><h1>Доброе утро, {context.user.displayName.split(' ')[0]}</h1><p>На {context.objects.length} объектах работают {peoplePresent} человек. {issueCount ? `${issueCount} события требуют решения.` : 'Событий, требующих решения, нет.'}</p></div><div className="contractor-welcome__sync"><CheckCircle2 size={16} /><span><b>Данные актуальны</b><small>PostgreSQL · обновлено сейчас</small></span></div></section>

          <section className="contractor-metrics" aria-label="Оперативные показатели">{metrics.map(({ label, value, suffix, detail, note, badge, progress, tone, icon: Icon, background }) => <article className={`contractor-metric contractor-metric--${tone}`} key={label}><img className="contractor-metric__background" src={background} alt="" aria-hidden="true" /><header className="contractor-metric__header"><span className="contractor-metric__icon"><Icon size={18} /></span><span className="contractor-metric__label">{label}</span><span className="contractor-metric__badge">{badge}</span></header><div className="contractor-metric__value"><strong>{value}</strong><span>{suffix}</span></div><p className="contractor-metric__detail">{detail}</p><footer className="contractor-metric__footer"><span>{note}</span>{typeof progress === 'number' ? <i aria-label={`${progress}%`}><b style={{ width: `${progress}%` }} /></i> : null}</footer></article>)}</section>

          <section className="contractor-section"><header><div><span>Стройплощадки</span><h2>Объекты сегодня</h2></div><button type="button" onClick={() => { setSearch(''); notify('Показаны все доступные объекты') }}>Все объекты<ChevronRight size={16} /></button></header><div className="contractor-objects">{filteredObjects.map((object, index) => <ContractorObjectCard object={object} index={index} onOpen={() => notify(`Открываем ${object.name}`)} key={object.id} />)}</div>{filteredObjects.length === 0 ? <div className="contractor-empty">По запросу «{search}» объекты не найдены.</div> : null}</section>

          <div className="contractor-dashboard-grid">
            <section className="contractor-panel contractor-panel--attention"><header><div><span>Приоритет</span><h2>Требует внимания</h2></div><strong>{issueCount}</strong></header><div className="contractor-attention-list">{attentionObjects.length ? attentionObjects.map((object) => <button type="button" onClick={() => notify(`Открываем события: ${object.name}`)} key={object.id}><span className="attention-dot attention-dot--critical"><AlertTriangle size={16} /></span><span><small>Контроль объекта</small><b>{object.issueCount} {object.issueCount === 1 ? 'событие требует' : 'события требуют'} решения</b><em>{object.name} · {object.code}</em></span><time>сейчас</time><ChevronRight size={16} /></button>) : <div className="contractor-panel-empty"><CheckCircle2 size={18} />Нет событий, требующих решения</div>}</div></section>
            <section className="contractor-panel contractor-panel--tasks"><header><div><span>План / факт</span><h2>Ход работ по объектам</h2></div><button type="button" onClick={() => notify('Фильтры подключим к задачам в S01')}><SlidersHorizontal size={17} />Фильтр</button></header><div className="contractor-task-list">{context.objects.map((object, index) => <button type="button" onClick={() => notify(`Открываем ход работ: ${object.name}`)} key={object.id}><span className={`task-tone task-tone--${index === 1 ? 'green' : index === 2 ? 'orange' : 'blue'}`} /><span className="contractor-task-list__name"><b>{object.name}</b><small>{object.code} · {object.presentWorkers} человек</small></span><span><small>План дня</small><b>100%</b></span><span><small>Факт</small><b>{object.dayProgress}%</b></span><span><small>Явка</small><b>{object.presentWorkers}/{object.plannedWorkers}</b></span><span className="contractor-task-list__progress"><i><em style={{ width: `${object.dayProgress}%` }} /></i><b>{object.dayProgress}%</b></span><ChevronRight size={16} /></button>)}</div><footer><button type="button" onClick={() => notify('Формирование сводки появится после S01')}><Download size={16} />Скачать сводку</button><button type="button" onClick={() => notify('Все задачи появятся в S01')}>Открыть все задачи<ArrowUpRight size={15} /></button></footer></section>
          </div>
          </>}
        </div>
        <nav className="contractor-mobile-nav" aria-label="Навигация подрядчика"><button className={activeSection === 'overview' ? 'is-active' : ''} type="button" onClick={() => { setActiveSection('overview'); setSearch('') }}><Home size={19} /><span>Обзор</span></button><button type="button" onClick={() => notify('Раздел объектов продолжим после F02')}><Building2 size={19} /><span>Объекты</span></button><button type="button" onClick={() => notify('Задачи появятся в S01')}><ClipboardList size={19} /><span>Задачи</span>{issueCount ? <i>{issueCount}</i> : null}</button><button className={activeSection === 'team' ? 'is-active' : ''} type="button" onClick={() => { setActiveSection('team'); setSearch('') }}><Users size={19} /><span>Команда</span></button></nav>
        {notice ? <div className="contractor-toast" role="status">{notice}</div> : null}
      </div>
    </section>
  )
}

const memberRoleLabels: Record<Role, string> = { contractor: 'Подрядчик', foreman: 'Бригадир', worker: 'Рабочий' }

function ContractorTeamView({ context, search, notify }: { context: MeContextResponse; search: string; notify: (message: string) => void }) {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [roleFilter, setRoleFilter] = useState<'all' | 'foreman' | 'worker'>('all')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    loadMembers(controller.signal)
      .then(({ members: nextMembers }) => {
        setMembers(nextMembers)
        setDrafts(Object.fromEntries(nextMembers.map((member) => [member.id, member.objectIds])))
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить сотрудников.')
        setStatus('error')
      })
    return () => controller.abort()
  }, [])

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    return members.filter((member) => {
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      const matchesSearch = !query || `${member.displayName} ${member.phone} ${memberRoleLabels[member.role]}`.toLocaleLowerCase('ru-RU').includes(query)
      return matchesRole && matchesSearch
    })
  }, [members, roleFilter, search])

  function toggleObject(memberId: string, objectId: string) {
    setDrafts((current) => {
      const assigned = current[memberId] ?? []
      return { ...current, [memberId]: assigned.includes(objectId) ? assigned.filter((id) => id !== objectId) : [...assigned, objectId] }
    })
  }

  async function save(member: MemberSummary) {
    const objectIds = drafts[member.id] ?? []
    setSavingId(member.id)
    setError(null)
    try {
      const response = await updateMemberObjects(member.id, objectIds)
      setMembers((current) => current.map((item) => item.id === member.id ? response.member : item))
      setDrafts((current) => ({ ...current, [member.id]: response.member.objectIds }))
      setEditingId(null)
      notify(`Назначения сотрудника «${member.displayName}» сохранены`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить назначения.')
    } finally {
      setSavingId(null)
    }
  }

  function cancelEditing(member: MemberSummary) {
    setDrafts((current) => ({ ...current, [member.id]: member.objectIds }))
    setEditingId(null)
  }

  return <section className="contractor-team">
    <header className="contractor-team__hero"><div><span>Сотрудники и доступ</span><h1>Команда</h1><p>Назначайте сотрудников на объекты. Изменения сразу применяются ко всем ролям.</p></div><button type="button" onClick={() => notify('Приглашения сотрудников — следующий шаг F02')}><Plus size={18} />Пригласить сотрудника</button></header>
    <div className="contractor-team__summary"><article><Users size={19} /><span><b>{members.length}</b><small>сотрудников</small></span></article><article><HardHat size={19} /><span><b>{members.filter((member) => member.role === 'worker').length}</b><small>рабочих</small></span></article><article><Building2 size={19} /><span><b>{context.objects.length}</b><small>объектов</small></span></article><div className="contractor-team__filters"><button className={roleFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setRoleFilter('all')}>Все</button><button className={roleFilter === 'foreman' ? 'is-active' : ''} type="button" onClick={() => setRoleFilter('foreman')}>Бригадиры</button><button className={roleFilter === 'worker' ? 'is-active' : ''} type="button" onClick={() => setRoleFilter('worker')}>Рабочие</button></div></div>
    {error ? <div className="contractor-team__error"><AlertTriangle size={17} />{error}</div> : null}
    {status === 'loading' ? <div className="contractor-team__state"><LoaderCircle className="spin" size={22} />Загружаем сотрудников из PostgreSQL</div> : null}
    {status === 'error' ? <div className="contractor-team__state"><AlertTriangle size={22} />Список сотрудников временно недоступен</div> : null}
    {status === 'ready' ? <div className="contractor-member-list">{visibleMembers.map((member) => {
      const draft = drafts[member.id] ?? []
      const changed = [...draft].sort().join(',') !== [...member.objectIds].sort().join(',')
      const immutable = member.role === 'contractor'
      const editing = editingId === member.id
      const assignedObjects = context.objects.filter((object) => draft.includes(object.id))
      const shownObjects = editing ? context.objects : assignedObjects.slice(0, 2)
      const hiddenObjectCount = editing ? 0 : assignedObjects.length - shownObjects.length
      return <article className={`contractor-member${editing ? ' is-editing' : ''}`} key={member.id}>
        <div className={`contractor-member__avatar contractor-member__avatar--${member.role}`}>{member.initials}</div>
        <div className="contractor-member__identity"><span><b>{member.displayName}</b><em>{memberRoleLabels[member.role]}</em></span><small className="contractor-member__phone"><Phone size={13} />{member.phone}</small></div>
        <div className="contractor-member__scope"><header><small>{immutable ? 'Доступ' : editing ? 'Выберите объекты' : 'Назначен на объекты'}</small>{!immutable && !editing ? <button className="contractor-member__scope-edit" type="button" onClick={() => setEditingId(member.id)}><SlidersHorizontal size={14} />Изменить</button> : null}</header><div>{immutable ? <span className="contractor-member__all"><CheckCircle2 size={14} />Все объекты</span> : shownObjects.length ? <>{shownObjects.map((object) => <button className={draft.includes(object.id) ? 'is-selected' : ''} type="button" disabled={!editing} onClick={() => toggleObject(member.id, object.id)} key={object.id}><span>{draft.includes(object.id) ? <CheckCircle2 size={14} /> : <Building2 size={14} />}</span>{object.name}<small>{object.code}</small></button>)}{hiddenObjectCount > 0 ? <span className="contractor-member__more">+{hiddenObjectCount}</span> : null}</> : <span className="contractor-member__none">Объекты не назначены</span>}</div></div>
        <div className="contractor-member__action">{immutable ? <span>Владелец</span> : editing ? <><button className="contractor-member__cancel" type="button" disabled={savingId === member.id} onClick={() => cancelEditing(member)}>Отмена</button><button type="button" disabled={!changed || savingId === member.id} onClick={() => save(member)}>{savingId === member.id ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />}{savingId === member.id ? 'Сохраняем' : 'Сохранить'}</button></> : null}</div>
      </article>
    })}{visibleMembers.length === 0 ? <div className="contractor-team__state"><Search size={22} />Сотрудники по заданным условиям не найдены</div> : null}</div> : null}
  </section>
}

function ContractorObjectCard({ object, index, onOpen }: { object: ObjectSummary; index: number; onOpen: () => void }) {
  const visual = objectVisuals[index % objectVisuals.length] ?? objectVisuals[0]
  return <article className={`contractor-object contractor-object--${visual.tone}`}><img className="contractor-object__background" src={visual.background} alt="" /><div className="contractor-object__top"><span>Активный объект</span><button type="button" aria-label={`Меню ${object.name}`}><MoreHorizontal size={18} /></button></div><div className="contractor-object__title"><span className="object-avatar"><Building2 size={19} /></span><div><h3>{object.name}</h3><p>{object.code}</p></div></div><div className="contractor-object__stats"><span><small>На объекте</small><b>{object.presentWorkers}<em>/{object.plannedWorkers}</em></b></span><span><small>План дня</small><b>{object.dayProgress}%</b></span><span className={object.issueCount ? 'has-issue' : ''}><small>Контроль</small><b>{object.issueCount ? `${object.issueCount} проблемы` : 'Без блокировок'}</b></span></div><button className="contractor-object__open" type="button" onClick={onOpen}>Открыть объект<ArrowUpRight size={16} /></button><span className="contractor-object__progress"><i style={{ width: `${object.dayProgress}%` }} /></span></article>
}

function MobileSessionWorkspace({ context, kind, onLogout }: { context: MeContextResponse; kind: 'foreman' | 'worker'; onLogout: () => void }) {
  return <div className="mobile-session-frame"><button className="mobile-session-exit" type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={17} /></button>{kind === 'worker' ? <WorkerHomeWorkspace context={context} /> : <MobileWorkspace context={context} kind={kind} />}</div>
}

function SwipeAction({ label, onComplete }: { label: string; onComplete: () => void }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useMemo(() => ({ value: 0 }), [])
  return <div className={`swipe-action ${dragging ? 'is-dragging' : ''}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startX.value = event.clientX - offset; setDragging(true) }} onPointerMove={(event) => { if (!dragging) return; setOffset(Math.max(0, Math.min(event.currentTarget.clientWidth - 54, event.clientX - startX.value))) }} onPointerUp={(event) => { setDragging(false); const limit = event.currentTarget.clientWidth - 54; if (offset >= limit * .72) { setOffset(limit); window.setTimeout(() => { setOffset(0); onComplete() }, 160) } else setOffset(0) }}><span className="swipe-action__label">{label}</span><span className="swipe-action__thumb" style={{ transform: `translateX(${offset}px)` }}><ArrowRight size={18} /></span></div>
}

function WorkerHomeWorkspace({ context }: { context: MeContextResponse }) {
  const object = context.objects[0]
  const [shift, setShift] = useState<Awaited<ReturnType<typeof loadCurrentShift>>['shift']>(null)
  const [showQr, setShowQr] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => { void loadCurrentShift().then((result) => setShift(result.shift)).catch(() => undefined) }, [])
  const now = new Date()
  const dateLabel = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const start = async (token: string) => { if (!object) return; try { const result = await startShift({ objectId: object.id, qrToken: token, occurredAtDevice: new Date().toISOString() }); setShift(result.shift); setShowQr(false); setQrToken(''); setNotice('Смена начата — QR-код подтверждён') } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось начать смену') } }
  return <main className="mobile-shell"><section className="phone-app worker-home"><header className="mobile-header"><Brand compact /><div><button type="button" aria-label="Уведомления"><Bell size={20} /></button><span>{context.user.initials}</span></div></header><div className="mobile-content worker-home__content"><section className="worker-welcome"><span>{dateLabel}</span><h1>Доброе утро, {context.user.displayName.split(' ').at(-1)}</h1></section><section className="worker-day-hero"><header className="worker-day-hero__summary"><div className="worker-day-hero__time"><time>{now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time></div><div className="worker-day-hero__weather"><img src="/graphics/weather/weather-sunny-3d.png" alt="Погода: ясно" /><span><strong>+18°</strong><small>Ясно</small></span></div></header><div className={`worker-day-hero__shift worker-day-hero__shift--${shift ? 'active' : 'idle'}`}><div className="worker-day-hero__shift-copy"><img src={`/graphics/shift/shift-${shift ? 'active' : 'idle'}-apple.png`} alt="" /><span><small>{object?.name ?? 'Объект не назначен'} · {object?.code ?? ''}</small><b>{shift ? 'Смена идёт' : 'Смена не начата'}</b><em>{shift ? `Начата в ${new Date(shift.startedAtServer).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · отправлено` : 'Готово к началу рабочего дня'}</em></span></div>{shift ? <div className="worker-shift-started">Смена подтверждена</div> : <SwipeAction label="Свайп, чтобы начать смену" onComplete={() => setShowQr(true)} />}</div></section></div><nav className="mobile-nav">{context.navigation.slice(0, 4).map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={19} /><span>{item.label}</span></button> })}</nav>{showQr ? <QrModal objectName={object?.name} onClose={() => setShowQr(false)} qrToken={qrToken} onToken={setQrToken} onSubmit={() => void start(qrToken)} /> : null}{notice ? <button className="worker-toast" type="button" onClick={() => setNotice(null)}>{notice}</button> : null}</section></main>
}

function QrModal({ objectName, onClose, qrToken, onToken, onSubmit }: { objectName?: string; onClose: () => void; qrToken: string; onToken: (value: string) => void; onSubmit: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => { let stream: MediaStream | undefined; let timer: number | undefined; const run = async () => { try { stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } }); if (videoRef.current && stream) { videoRef.current.srcObject = stream; await videoRef.current.play(); } const Detector = (window as Window & { BarcodeDetector?: new () => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector; if (Detector && videoRef.current) { const detector = new Detector(); const scan = async () => { if (videoRef.current?.readyState === 4) { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) onToken(codes[0].rawValue) } timer = window.setTimeout(() => void scan(), 500) }; void scan() } } catch { /* manual fallback remains available */ } }; void run(); return () => { if (timer) window.clearTimeout(timer); stream?.getTracks().forEach((track) => track.stop()) } }, [onToken])
  return <div className="qr-modal-backdrop"><section className="qr-modal" role="dialog" aria-modal="true"><button className="qr-modal__close" type="button" onClick={onClose}>×</button><span className="qr-modal__icon">▦</span><h2>Отсканируйте QR-код</h2><p>Наведите камеру на QR-код объекта «{objectName ?? '—'}».</p><div className="qr-camera-placeholder"><video ref={videoRef} muted playsInline />Камера готова к сканированию</div><label>Если камера недоступна, введите код<input value={qrToken} onChange={(event) => onToken(event.target.value)} placeholder="SMENA-QR-…" /></label><button className="qr-modal__submit" type="button" disabled={!qrToken.trim()} onClick={onSubmit}>Подтвердить QR</button></section></div>
}

function MobileWorkspace({ context, kind }: { context: MeContextResponse; kind: 'foreman' | 'worker' }) {
  const object = context.objects[0]
  return <main className="mobile-shell"><section className="phone-app"><header className="mobile-header"><Brand compact /><div><button type="button" aria-label="Уведомления"><Bell size={19} /></button><span>{context.user.initials}</span></div></header><div className="mobile-content"><span className="mobile-eyebrow">{roleLabels[context.user.role]} · {context.organization.name}</span><h1>{kind === 'foreman' ? 'Контроль объектов' : 'Рабочий день'}</h1><p>{context.user.displayName}</p><section className="access-card"><span><CheckCircle2 size={20} /></span><div><small>Серверный контекст</small><b>{context.objects.length} {context.objects.length === 1 ? 'доступный объект' : 'доступных объекта'}</b><p>Интерфейс построен только из разрешённых данных.</p></div></section>{object ? <article className="mobile-object"><header><span><Building2 size={19} /></span><em>{object.code}</em></header><h2>{object.name}</h2><dl><div><dt>На объекте</dt><dd>{object.presentWorkers}/{object.plannedWorkers}</dd></div><div><dt>План дня</dt><dd>{object.dayProgress}%</dd></div><div><dt>Проблемы</dt><dd>{object.issueCount}</dd></div></dl></article> : null}<section className="next-slice"><FileText size={20} /><div><small>Следующий вертикальный срез</small><b>{kind === 'worker' ? 'Начало и завершение смены' : 'Явка команды в реальном времени'}</b></div></section></div><nav className="mobile-nav">{context.navigation.map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={19} /><span>{item.label}</span></button> })}</nav></section></main>
}
