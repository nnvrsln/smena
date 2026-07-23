import type { CreateObjectRequest, MeContextResponse, MemberSummary, MemberTimesheetHistoryResponse, NavigationKey, ObjectSummary, Role, TimesheetDayDetail, TimesheetDaySummary } from '@smena/contracts'
import {
  AlertTriangle, ArrowLeft, ArrowUpRight, BarChart3, Bell, Building2, CalendarDays, CheckCircle2,
  ChevronRight, ClipboardList, Clock3, Download, FileText, HardHat, Home,
  LoaderCircle, LogOut, MapPin, MessageCircle, MoreHorizontal, Pencil, Phone, Plus, Search, Settings, SlidersHorizontal, UserRound, Users, ArrowRight, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createObject, endShift, loadMemberTimesheetHistory, loadMembers, loadTimesheetDay, loadTimesheetDays, loadTodayShift, startShift, updateMemberObjects, updateObject, updateObjectMembers } from '../api/context'
import { Brand } from './Brand'
import { InvitationManager } from './InvitationManager'

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
  const [activeSection, setActiveSection] = useState<'overview' | 'objects' | 'team' | 'timesheet'>('overview')
  const [memberProfile, setMemberProfile] = useState<{ id: string; returnSection: 'team' | 'timesheet' } | null>(null)
  const [objectEditor, setObjectEditor] = useState<ObjectSummary | 'new' | null>(null)
  const [managedObjects, setManagedObjects] = useState(context.objects)
  useEffect(() => setManagedObjects(context.objects), [context.objects])
  const peoplePresent = managedObjects.reduce((sum, object) => sum + object.presentWorkers, 0)
  const peoplePlanned = managedObjects.reduce((sum, object) => sum + object.plannedWorkers, 0)
  const issueCount = managedObjects.reduce((sum, object) => sum + object.issueCount, 0)
  const averageProgress = Math.round(managedObjects.reduce((sum, object) => sum + object.dayProgress, 0) / Math.max(managedObjects.length, 1))
  const workingNow = Math.max(peoplePresent - Math.round(peoplePresent * .14), 0)
  const filteredObjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    return query ? managedObjects.filter((object) => `${object.name} ${object.code}`.toLocaleLowerCase('ru-RU').includes(query)) : managedObjects
  }, [managedObjects, search])
  const attentionObjects = managedObjects.filter((object) => object.issueCount > 0)
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2600)
  }

  const metrics = [
    { label: 'Люди на смене', value: peoplePresent, suffix: `из ${peoplePlanned} по плану`, detail: 'Фактически вышли на объекты', note: `${Math.round(peoplePresent / Math.max(peoplePlanned, 1) * 100)}% явки`, badge: `${Math.round(peoplePresent / Math.max(peoplePlanned, 1) * 100)}% явки`, progress: Math.round(peoplePresent / Math.max(peoplePlanned, 1) * 100), tone: 'blue', icon: Users, background: '/graphics/backgrounds/metric-workforce-3d.webp' },
    { label: 'Сейчас в работе', value: workingNow, suffix: 'человек', detail: 'Выполняют назначенные задачи', note: `${peoplePresent - workingNow} на паузе или без задачи`, badge: `${Math.round(workingNow / Math.max(peoplePresent, 1) * 100)}% заняты`, progress: Math.round(workingNow / Math.max(peoplePresent, 1) * 100), tone: 'green', icon: HardHat, background: '/graphics/backgrounds/metric-active-work-3d.webp' },
    { label: 'План дня', value: `${averageProgress}%`, suffix: 'средний прогресс', detail: 'По доступным объектам', note: `${managedObjects.length} объекта в расчёте`, badge: `${averageProgress}% готово`, progress: averageProgress, tone: 'violet', icon: ClipboardList, background: '/graphics/backgrounds/metric-tasks-3d.webp' },
    { label: 'Требует внимания', value: issueCount, suffix: issueCount === 1 ? 'событие' : 'события', detail: 'Нужны решения подрядчика', note: attentionObjects.length ? `${attentionObjects.length} объекта с вопросами` : 'Блокировок нет', badge: 'Приоритет', progress: null, tone: 'orange', icon: AlertTriangle, background: '/graphics/backgrounds/metric-attention-3d.webp' },
  ] as const

  return (
    <section className="contractor-shell" aria-label="Кабинет подрядчика">
      <aside className="contractor-sidebar">
        <Brand />
        <div className="contractor-sidebar__object"><span>Организация</span><button type="button" onClick={() => notify(context.organization.name)}><span className="object-mini-logo">{context.organization.name.slice(0, 2).toUpperCase()}</span><span><b>{context.organization.name}</b><small>{managedObjects.length} активных объекта</small></span></button></div>
        <nav aria-label="Кабинет подрядчика">{context.navigation.map((item) => { const Icon = navigationIcons[item.key]; const available = item.key === 'overview' || item.key === 'objects' || item.key === 'team' || item.key === 'timesheet'; return <button type="button" className={activeSection === item.key ? 'is-active' : ''} onClick={() => { if (available) { setActiveSection(item.key as 'overview' | 'objects' | 'team' | 'timesheet'); setMemberProfile(null); setSearch(''); setObjectEditor(null) } else notify(`${item.label}: раздел пока недоступен`) }} key={item.key}><Icon size={19} strokeWidth={2.1} /><span>{item.label}</span>{item.key === 'tasks' && issueCount ? <small>{issueCount}</small> : null}</button> })}</nav>
        <div className="contractor-sidebar__footer"><button type="button" onClick={() => notify('Настройки будут подключены отдельным срезом')}><Settings size={19} />Настройки</button><div className="contractor-profile"><span className="contractor-avatar">{context.user.initials}</span><span><b>{context.user.displayName}</b><small>Подрядчик</small></span><button type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={18} /></button></div></div>
      </aside>

      <div className="contractor-workspace">
        <header className="contractor-topbar" aria-label="Верхняя панель кабинета">
          <div className="contractor-mobile-brand"><Brand compact /></div>
          <label className={`contractor-search ${memberProfile ? 'is-context' : ''}`}>{memberProfile ? <UserRound size={18} /> : <Search size={18} />}<input aria-label="Поиск" disabled={Boolean(memberProfile)} placeholder={memberProfile ? 'Карточка сотрудника' : activeSection === 'team' || activeSection === 'timesheet' ? 'Найти сотрудника' : 'Найти объект'} value={memberProfile ? '' : search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="contractor-topbar__actions"><div className="contractor-date" aria-label="Период данных: сегодня"><CalendarDays size={17} /><span>Сегодня</span></div><button className="contractor-icon-button" type="button" aria-label={`Уведомления: ${issueCount}`} onClick={() => notify(`${issueCount} событий требуют внимания`)}><Bell size={20} />{issueCount ? <i>{issueCount}</i> : null}</button></div>
        </header>

        <div className="contractor-content">
          {memberProfile ? <MemberProfileView memberId={memberProfile.id} objects={managedObjects} onBack={() => { setActiveSection(memberProfile.returnSection); setMemberProfile(null) }} /> : activeSection === 'objects' ? <ContractorObjectsView sourceObjects={managedObjects} search={search} editor={objectEditor} setEditor={setObjectEditor} notify={notify} onObjectChanged={(saved) => setManagedObjects((current) => current.some((object) => object.id === saved.id) ? current.map((object) => object.id === saved.id ? saved : object) : [...current, saved])} /> : activeSection === 'team' ? <ContractorTeamView context={{ ...context, objects: managedObjects }} search={search} onClearSearch={() => setSearch('')} notify={notify} onOpenMember={(memberId) => { setSearch(''); setMemberProfile({ id: memberId, returnSection: 'team' }) }} onAssignmentChanged={(previous, saved) => {
            if (saved.role !== 'worker') return
            setManagedObjects((current) => current.map((object) => {
              const before = previous.objectIds.includes(object.id)
              const after = saved.objectIds.includes(object.id)
              return before === after ? object : { ...object, plannedWorkers: Math.max(0, object.plannedWorkers + (after ? 1 : -1)) }
            }))
          }} /> : activeSection === 'timesheet' ? <TimesheetView search={search} onOpenMember={(memberId) => { setSearch(''); setMemberProfile({ id: memberId, returnSection: 'timesheet' }) }} /> : <>
          <section className="contractor-welcome"><div><span>Оперативная сводка</span><h1>Доброе утро, {context.user.displayName.split(' ')[0]}</h1><p>На {managedObjects.length} объектах работают {peoplePresent} человек. {issueCount ? `${issueCount} события требуют решения.` : 'Событий, требующих решения, нет.'}</p></div><div className="contractor-welcome__sync"><CheckCircle2 size={16} /><span><b>Обновлено сейчас</b><small>Показатели за сегодня</small></span></div></section>

          <section className="contractor-metrics" aria-label="Оперативные показатели">{metrics.map(({ label, value, suffix, detail, note, badge, progress, tone, icon: Icon, background }) => <article className={`contractor-metric contractor-metric--${tone}`} key={label}><img className="contractor-metric__background" src={background} alt="" aria-hidden="true" /><header className="contractor-metric__header"><span className="contractor-metric__icon"><Icon size={18} /></span><span className="contractor-metric__label">{label}</span><span className="contractor-metric__badge">{badge}</span></header><div className="contractor-metric__value"><strong>{value}</strong><span>{suffix}</span></div><p className="contractor-metric__detail">{detail}</p><footer className="contractor-metric__footer"><span>{note}</span>{typeof progress === 'number' ? <i aria-label={`${progress}%`}><b style={{ width: `${progress}%` }} /></i> : null}</footer></article>)}</section>

          <section className="contractor-section"><header><div><span>Стройплощадки</span><h2>Объекты сегодня</h2></div><button type="button" onClick={() => { setSearch(''); notify('Показаны все доступные объекты') }}>Все объекты<ChevronRight size={16} /></button></header><div className="contractor-objects">{filteredObjects.map((object, index) => <ContractorObjectCard object={object} index={index} onOpen={() => notify(`Открываем ${object.name}`)} key={object.id} />)}</div>{filteredObjects.length === 0 ? <div className="contractor-empty">По запросу «{search}» объекты не найдены.</div> : null}</section>

          <div className="contractor-dashboard-grid">
            <section className="contractor-panel contractor-panel--attention"><header><div><span>Приоритет</span><h2>Требует внимания</h2></div><strong>{issueCount}</strong></header><div className="contractor-attention-list">{attentionObjects.length ? attentionObjects.map((object) => <button type="button" onClick={() => notify(`Открываем события: ${object.name}`)} key={object.id}><span className="attention-dot attention-dot--critical"><AlertTriangle size={16} /></span><span><small>Контроль объекта</small><b>{object.issueCount} {object.issueCount === 1 ? 'событие требует' : 'события требуют'} решения</b><em>{object.name} · {object.code}</em></span><time>сейчас</time><ChevronRight size={16} /></button>) : <div className="contractor-panel-empty"><CheckCircle2 size={18} />Нет событий, требующих решения</div>}</div></section>
            <section className="contractor-panel contractor-panel--tasks"><header><div><span>План / факт</span><h2>Ход работ по объектам</h2></div><button type="button" onClick={() => notify('Фильтры подключим к задачам в S01')}><SlidersHorizontal size={17} />Фильтр</button></header><div className="contractor-task-list">{managedObjects.map((object, index) => <button type="button" onClick={() => notify(`Открываем ход работ: ${object.name}`)} key={object.id}><span className={`task-tone task-tone--${index === 1 ? 'green' : index === 2 ? 'orange' : 'blue'}`} /><span className="contractor-task-list__name"><b>{object.name}</b><small>{object.code} · {object.presentWorkers} человек</small></span><span><small>План дня</small><b>100%</b></span><span><small>Факт</small><b>{object.dayProgress}%</b></span><span><small>Явка</small><b>{object.presentWorkers}/{object.plannedWorkers}</b></span><span className="contractor-task-list__progress"><i><em style={{ width: `${object.dayProgress}%` }} /></i><b>{object.dayProgress}%</b></span><ChevronRight size={16} /></button>)}</div><footer><button type="button" onClick={() => notify('Формирование сводки появится после S01')}><Download size={16} />Скачать сводку</button><button type="button" onClick={() => notify('Все задачи появятся в S01')}>Открыть все задачи<ArrowUpRight size={15} /></button></footer></section>
          </div>
          </>}
        </div>
        <nav className="contractor-mobile-nav" aria-label="Навигация подрядчика"><button className={activeSection === 'overview' ? 'is-active' : ''} type="button" onClick={() => { setActiveSection('overview'); setMemberProfile(null); setSearch('') }}><Home size={19} /><span>Обзор</span></button><button className={activeSection === 'objects' ? 'is-active' : ''} type="button" onClick={() => { setActiveSection('objects'); setMemberProfile(null); setSearch('') }}><Building2 size={19} /><span>Объекты</span></button><button className={activeSection === 'timesheet' ? 'is-active' : ''} type="button" onClick={() => { setActiveSection('timesheet'); setMemberProfile(null); setSearch('') }}><Clock3 size={19} /><span>Табель</span></button><button className={activeSection === 'team' ? 'is-active' : ''} type="button" onClick={() => { setActiveSection('team'); setMemberProfile(null); setSearch('') }}><Users size={19} /><span>Команда</span></button></nav>
        {notice ? <div className="contractor-toast" role="status">{notice}</div> : null}
      </div>
    </section>
  )
}

const memberRoleLabels: Record<Role, string> = { contractor: 'Подрядчик', foreman: 'Бригадир', worker: 'Рабочий' }
const memberSpecializations: Record<Role, string> = {
  contractor: 'Управление проектами',
  foreman: 'Организация строительных работ',
  worker: 'Строительно-монтажные работы',
}

function formatMemberPhone(phone: string) {
  const digits = phone.replace(/\D/gu, '')
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }
  return phone
}

function ContractorTeamView({ context, search, onClearSearch, notify, onOpenMember, onAssignmentChanged }: {
  context: MeContextResponse
  search: string
  onClearSearch: () => void
  notify: (message: string) => void
  onOpenMember: (memberId: string) => void
  onAssignmentChanged: (previous: MemberSummary, saved: MemberSummary) => void
}) {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [roleFilter, setRoleFilter] = useState<'all' | 'foreman' | 'worker'>('all')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const editingIdRef = useRef<string | null>(null)
  editingIdRef.current = editingId

  useEffect(() => {
    const controller = new AbortController()
    let loaded = false
    setStatus('loading')
    const refresh = () => loadMembers(controller.signal)
      .then(({ members: nextMembers }) => {
        setMembers(nextMembers)
        setDrafts((current) => Object.fromEntries(nextMembers.map((member) => [
          member.id,
          editingIdRef.current === member.id ? current[member.id] ?? member.objectIds : member.objectIds,
        ])))
        setStatus('ready')
        setError(null)
        loaded = true
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить сотрудников.')
        if (!loaded) setStatus('error')
      })
    void refresh()
    const timer = window.setInterval(() => void refresh(), 5_000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [])

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    return members.filter((member) => {
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      const matchesSearch = !query || `${member.displayName} ${member.phone} ${memberRoleLabels[member.role]} ${member.specialization ?? memberSpecializations[member.role]}`.toLocaleLowerCase('ru-RU').includes(query)
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
      onAssignmentChanged(member, response.member)
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

  const resetDirectory = () => {
    setRoleFilter('all')
    onClearSearch()
  }

  return <>
  <section className="contractor-page contractor-team">
    <header className="contractor-page__hero contractor-team__hero"><div><span>Люди и назначения</span><h1>Команда организации</h1><p>Смотрите состав команды и назначайте сотрудников на объекты.</p></div><div className="contractor-team__hero-actions"><button className="is-secondary" type="button" onClick={resetDirectory}><Users size={18} />Показать всех</button><button type="button" onClick={() => setInviteOpen(true)}><Plus size={18} />Пригласить</button></div></header>
    <div className="contractor-page__summary contractor-team__summary" aria-label="Сводка по команде"><article><span className="is-blue"><Users size={19} /></span><div><b>{members.length}</b><small>сотрудников</small></div></article><article><span className="is-green"><HardHat size={19} /></span><div><b>{members.filter((member) => member.role === 'worker').length}</b><small>рабочих</small></div></article><article><span className="is-orange"><Building2 size={19} /></span><div><b>{context.objects.length}</b><small>активных объектов</small></div></article></div>
    <div className="contractor-page__toolbar contractor-team__toolbar"><div><b>{search.trim() || roleFilter !== 'all' ? `Найдено: ${visibleMembers.length}` : 'Все сотрудники'}</b><small>{visibleMembers.length} в списке</small></div><div className="contractor-team__filters" aria-label="Фильтр сотрудников"><button className={roleFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setRoleFilter('all')}>Все</button><button className={roleFilter === 'foreman' ? 'is-active' : ''} type="button" onClick={() => setRoleFilter('foreman')}>Бригадиры</button><button className={roleFilter === 'worker' ? 'is-active' : ''} type="button" onClick={() => setRoleFilter('worker')}>Рабочие</button></div></div>
    {error ? <div className="contractor-team__error"><AlertTriangle size={17} />{error}</div> : null}
    {status === 'loading' ? <div className="contractor-team__state"><LoaderCircle className="spin" size={22} />Загружаем сотрудников</div> : null}
    {status === 'error' ? <div className="contractor-team__state"><AlertTriangle size={22} />Список сотрудников временно недоступен</div> : null}
    {status === 'ready' ? <div className="contractor-page__grid contractor-member-list">{visibleMembers.map((member) => {
      const draft = drafts[member.id] ?? []
      const changed = [...draft].sort().join(',') !== [...member.objectIds].sort().join(',')
      const immutable = member.role === 'contractor'
      const editing = editingId === member.id
      const assignedObjects = context.objects.filter((object) => draft.includes(object.id))
      const shownObjects = editing ? context.objects : assignedObjects.slice(0, 2)
      const hiddenObjectCount = editing ? 0 : assignedObjects.length - shownObjects.length
      const statusObject = context.objects.find((object) => object.id === member.todayObjectId)
      const statusLabel = member.todayStatus === 'on_shift'
        ? `На смене${statusObject ? ` · ${statusObject.name}` : ''}`
        : member.todayStatus === 'shift_completed'
          ? 'Смена завершена'
          : member.todayStatus === 'not_started'
            ? 'Сегодня не выходил'
            : 'Владелец организации'
      return <article className={`team-member-card team-member-card--${member.role}${editing ? ' is-editing' : ''}`} key={member.id}>
        <div className="team-member-card__body">
          <header className="team-member-card__person">
            <div className="team-member-card__avatar">{member.initials}</div>
            <div><span className="team-member-card__role">{memberRoleLabels[member.role]}</span><h2>{member.displayName}</h2><p><HardHat size={14} />{member.specialization ?? memberSpecializations[member.role]}</p><em className={`team-member-card__status team-member-card__status--${member.todayStatus}`}><i />{statusLabel}</em></div>
            {!immutable && !editing ? <button type="button" aria-label={`Настроить назначения сотрудника ${member.displayName}`} onClick={() => setEditingId(member.id)}><Pencil size={17} /></button> : null}
          </header>
          <a className="team-member-card__phone" href={`tel:${member.phone}`} aria-label={`Позвонить сотруднику ${member.displayName} по номеру ${formatMemberPhone(member.phone)}`}><Phone size={15} /><span>{formatMemberPhone(member.phone)}</span></a>
          <section className="team-member-card__scope">
            <header><div><small>{editing ? 'Выберите объекты' : 'Назначения'}</small><b>{immutable ? 'Все объекты' : assignedObjects.length ? `${assignedObjects.length} ${assignedObjects.length === 1 ? 'объект' : assignedObjects.length < 5 ? 'объекта' : 'объектов'}` : 'Нет назначений'}</b></div>{editing ? <span>{draft.length} выбрано</span> : null}</header>
            <div>{immutable ? <span className="team-member-card__all"><CheckCircle2 size={15} />Доступ ко всем объектам</span> : shownObjects.length ? <>{shownObjects.map((object) => editing ? <button className={draft.includes(object.id) ? 'is-selected' : ''} type="button" onClick={() => toggleObject(member.id, object.id)} key={object.id}><span>{draft.includes(object.id) ? <CheckCircle2 size={15} /> : <Building2 size={15} />}</span><b>{object.name}</b><small>{object.code}</small></button> : <span className="team-member-card__object" key={object.id}><Building2 size={15} /><b>{object.name}</b><small>{object.code}</small></span>)}{hiddenObjectCount > 0 ? <span className="team-member-card__more">+{hiddenObjectCount}</span> : null}</> : <span className="team-member-card__none">Объекты пока не назначены</span>}</div>
          </section>
          <footer className="team-member-card__actions">{editing ? <><button className="is-secondary" type="button" disabled={savingId === member.id} onClick={() => cancelEditing(member)}>Отмена</button><button type="button" disabled={!changed || savingId === member.id} onClick={() => save(member)}>{savingId === member.id ? <LoaderCircle className="spin" size={16} /> : <CheckCircle2 size={16} />}{savingId === member.id ? 'Сохраняем' : 'Сохранить'}</button></> : <><button className="is-secondary is-profile" type="button" onClick={() => onOpenMember(member.id)}><UserRound size={16} />Карточка</button>{immutable ? <span><CheckCircle2 size={15} />Владелец</span> : <button type="button" onClick={() => setEditingId(member.id)}><SlidersHorizontal size={16} />Назначения</button>}</>}</footer>
        </div>
      </article>
    })}{visibleMembers.length === 0 ? <div className="contractor-team__state"><Search size={22} />Сотрудники по заданным условиям не найдены</div> : null}</div> : null}
  </section>
  {inviteOpen ? <InvitationManager objects={context.objects} onClose={() => setInviteOpen(false)} /> : null}
  </>
}

function ContractorObjectCard({ object, index, onOpen }: { object: ObjectSummary; index: number; onOpen: () => void }) {
  const visual = objectVisuals[index % objectVisuals.length] ?? objectVisuals[0]
  const issueLabel = object.issueCount === 1 ? '1 проблема' : object.issueCount > 1 && object.issueCount < 5 ? `${object.issueCount} проблемы` : `${object.issueCount} проблем`
  return <article className={`contractor-object contractor-object--${visual.tone}`}><img className="contractor-object__background" src={visual.background} alt="" /><div className="contractor-object__top"><span>Активный объект</span><button type="button" aria-label={`Меню ${object.name}`}><MoreHorizontal size={18} /></button></div><div className="contractor-object__title"><span className="object-avatar"><Building2 size={19} /></span><div><h3>{object.name}</h3><p>{object.code}</p></div></div><div className="contractor-object__stats"><span><small>На объекте</small><b>{object.presentWorkers}<em>/{object.plannedWorkers}</em></b></span><span><small>План дня</small><b>{object.dayProgress}%</b></span><span className={object.issueCount ? 'has-issue' : ''}><small>Контроль</small><b>{object.issueCount ? issueLabel : 'Штатно'}</b></span></div><button className="contractor-object__open" type="button" onClick={onOpen}>Открыть объект<ArrowUpRight size={16} /></button><span className="contractor-object__progress"><i style={{ width: `${object.dayProgress}%` }} /></span></article>
}

function ContractorObjectsView({ sourceObjects, search, editor, setEditor, notify, onObjectChanged }: {
  sourceObjects: ObjectSummary[]
  search: string
  editor: ObjectSummary | 'new' | null
  setEditor: (value: ObjectSummary | 'new' | null) => void
  notify: (message: string) => void
  onObjectChanged: (object: ObjectSummary) => void
}) {
  const [objects, setObjects] = useState(sourceObjects)
  const [teamObject, setTeamObject] = useState<ObjectSummary | null>(null)
  useEffect(() => setObjects(sourceObjects), [sourceObjects])
  const query = search.trim().toLocaleLowerCase('ru-RU')
  const visibleObjects = query ? objects.filter((object) => `${object.name} ${object.code}`.toLocaleLowerCase('ru-RU').includes(query)) : objects
  const planned = objects.reduce((sum, object) => sum + object.plannedWorkers, 0)
  const present = objects.reduce((sum, object) => sum + object.presentWorkers, 0)
  const attention = objects.filter((object) => object.issueCount > 0).length
  const saveObject = (saved: ObjectSummary) => {
    setObjects((current) => current.some((object) => object.id === saved.id) ? current.map((object) => object.id === saved.id ? saved : object) : [...current, saved])
    onObjectChanged(saved)
    setEditor(null)
    notify(editor === 'new' ? 'Объект создан и добавлен в портфель' : 'Изменения объекта сохранены')
  }
  const saveTeam = (members: MemberSummary[]) => {
    if (!teamObject) return
    const plannedWorkers = members.filter((member) => member.role === 'worker' && member.objectIds.includes(teamObject.id)).length
    const saved = { ...teamObject, plannedWorkers }
    setObjects((current) => current.map((object) => object.id === saved.id ? saved : object))
    onObjectChanged(saved)
    setTeamObject(null)
    notify(`Состав объекта «${saved.name}» сохранён`)
  }
  return <section className="contractor-page object-manager">
    <header className="contractor-page__hero object-manager__hero">
      <div><span>Портфель объектов</span><h1>Управление стройплощадками</h1><p>Создавайте объекты и поддерживайте данные стройплощадок в актуальном состоянии.</p></div>
      <button type="button" onClick={() => setEditor('new')}><Plus size={18} />Добавить объект</button>
    </header>
    <div className="contractor-page__summary object-manager__summary" aria-label="Сводка по объектам">
      <article><span className="is-blue"><Building2 size={19} /></span><div><b>{objects.length}</b><small>активных объектов</small></div></article>
      <article><span className="is-green"><Users size={19} /></span><div><b>{present}<em>/{planned}</em></b><small>на смене / назначено</small></div></article>
      <article><span className="is-orange"><AlertTriangle size={19} /></span><div><b>{attention}</b><small>требуют внимания</small></div></article>
    </div>
    <div className="contractor-page__toolbar object-manager__bar"><div><b>{query ? `Найдено: ${visibleObjects.length}` : 'Все объекты'}</b><small>{visibleObjects.length} {visibleObjects.length === 1 ? 'стройплощадка' : 'стройплощадки'}</small></div></div>
    {visibleObjects.length ? <div className="contractor-page__grid object-manager__grid">{visibleObjects.map((object, index) => {
      const visual = objectVisuals[index % objectVisuals.length] ?? objectVisuals[0]
      return <article className={`managed-object managed-object--${visual.tone}`} key={object.id}>
        <div className="managed-object__visual"><img src={visual.background} alt="" aria-hidden="true" /><span><i />Активный объект</span><button type="button" aria-label={`Редактировать ${object.name}`} onClick={() => setEditor(object)}><Pencil size={17} /></button></div>
        <div className="managed-object__body"><span className="managed-object__icon"><Building2 size={20} /></span><div className="managed-object__title"><small>{object.code}</small><h2>{object.name}</h2><span><MapPin size={14} />Стройплощадка организации</span></div>
          <dl><div><dt>На смене</dt><dd>{object.presentWorkers}<em>/{object.plannedWorkers}</em></dd></div><div><dt>План дня</dt><dd>{object.dayProgress}%</dd></div><div><dt>Контроль</dt><dd className={object.issueCount ? 'has-issue' : 'is-calm'}>{object.issueCount ? `${object.issueCount} проблем${object.issueCount === 1 ? 'а' : 'ы'}` : 'Штатно'}</dd></div></dl>
          <div className="managed-object__progress"><span><small>Выполнение плана</small><b>{object.dayProgress}%</b></span><i><em style={{ width: `${object.dayProgress}%` }} /></i></div>
          <div className="managed-object__actions"><button type="button" onClick={() => setTeamObject(object)}><Users size={16} />Команда объекта</button><button type="button" onClick={() => setEditor(object)}><Pencil size={15} />Настройки</button></div>
        </div>
      </article>
    })}</div> : <div className="object-manager__empty"><Search size={24} /><h2>Объекты не найдены</h2><p>Измените запрос или добавьте новую стройплощадку.</p><button type="button" onClick={() => setEditor('new')}><Plus size={17} />Добавить объект</button></div>}
    {editor ? <ObjectEditor object={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSaved={saveObject} /> : null}
    {teamObject ? <ObjectTeamEditor object={teamObject} objects={objects} onClose={() => setTeamObject(null)} onSaved={saveTeam} /> : null}
  </section>
}

function ObjectEditor({ object, onClose, onSaved }: { object: ObjectSummary | null; onClose: () => void; onSaved: (object: ObjectSummary) => void }) {
  const [form, setForm] = useState<CreateObjectRequest>({ name: object?.name ?? '', code: object?.code ?? '' })
  const [touched, setTouched] = useState<Record<'name' | 'code', boolean>>({ name: false, code: false })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const errors = {
    name: form.name.trim().length < 3 ? 'Минимум 3 символа' : form.name.trim().length > 80 ? 'Не больше 80 символов' : '',
    code: form.code.trim().length < 2 ? 'Минимум 2 символа' : form.code.trim().length > 40 ? 'Не больше 40 символов' : '',
  }
  const invalid = Boolean(errors.name || errors.code)
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, saving])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    setRequestError(null)
    if (invalid) return
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), code: form.code.trim() }
      const response = object ? await updateObject(object.id, payload) : await createObject(payload)
      onSaved(response.object)
    } catch (error) { setRequestError(error instanceof Error ? error.message : 'Не удалось сохранить объект.') }
    finally { setSaving(false) }
  }
  const showError = (field: keyof typeof errors) => (submitted || touched[field]) && errors[field]
  return <div className="object-editor-backdrop"><aside className="object-editor" role="dialog" aria-modal="true" aria-labelledby="object-editor-title">
    <header><div><span>{object ? 'Настройка объекта' : 'Новая стройплощадка'}</span><h2 id="object-editor-title">{object ? 'Редактировать объект' : 'Создать объект'}</h2><p>{object ? 'Обновите основные данные стройплощадки.' : 'Укажите название и короткое обозначение объекта.'}</p></div><button type="button" onClick={onClose} aria-label="Закрыть" disabled={saving}><X size={20} /></button></header>
    <form onSubmit={(event) => void submit(event)} noValidate>
      <div className="object-editor__preview"><span><Building2 size={21} /></span><div><small>{form.code.trim() || 'Обозначение'}</small><b>{form.name.trim() || 'Название нового объекта'}</b></div><em>Активный</em></div>
      <label className={showError('name') ? 'has-error' : ''}><span>Название объекта<em>*</em></span><input autoFocus value={form.name} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} onBlur={() => setTouched((current) => ({ ...current, name: true }))} placeholder="Например, ЖК «Северный»" aria-invalid={Boolean(showError('name'))} /><small>{showError('name') || 'Полное название стройплощадки'}</small></label>
      <label className={showError('code') ? 'has-error' : ''}><span>Корпус или участок<em>*</em></span><input value={form.code} maxLength={40} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} onBlur={() => setTouched((current) => ({ ...current, code: true }))} placeholder="Например, Корпус 4" aria-invalid={Boolean(showError('code'))} /><small>{showError('code') || 'Короткое уникальное обозначение'}</small></label>
      {requestError ? <div className="object-editor__error" role="alert"><AlertTriangle size={17} />{requestError}</div> : null}
      <footer><button type="button" onClick={onClose} disabled={saving}>Отмена</button><button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}{saving ? 'Сохраняем…' : object ? 'Сохранить изменения' : 'Создать объект'}</button></footer>
    </form>
  </aside></div>
}

function ObjectTeamEditor({ object, objects, onClose, onSaved }: {
  object: ObjectSummary
  objects: ObjectSummary[]
  onClose: () => void
  onSaved: (members: MemberSummary[]) => void
}) {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    loadMembers(controller.signal).then((response) => {
      const assignable = response.members.filter((member) => member.role !== 'contractor' && member.status === 'active')
      setMembers(assignable)
      setSelectedIds(assignable.filter((member) => member.objectIds.includes(object.id)).map((member) => member.id))
      setStatus('ready')
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить команду.')
      setStatus('error')
    })
    return () => controller.abort()
  }, [object.id])
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, saving])
  const visibleMembers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ru-RU')
    return normalized ? members.filter((member) => `${member.displayName} ${memberRoleLabels[member.role]}`.toLocaleLowerCase('ru-RU').includes(normalized)) : members
  }, [members, query])
  const toggle = (memberId: string) => setSelectedIds((current) => current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId])
  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await updateObjectMembers(object.id, selectedIds)
      onSaved(response.members)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить состав объекта.')
    } finally { setSaving(false) }
  }
  return <div className="object-team-backdrop"><aside className="object-team-editor" role="dialog" aria-modal="true" aria-labelledby="object-team-title">
    <header><div><span>Команда объекта</span><h2 id="object-team-title">{object.name}</h2><p>{object.code} · выберите сотрудников с доступом к стройплощадке</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Закрыть"><X size={20} /></button></header>
    <div className="object-team-editor__summary"><span><Users size={18} /></span><div><b>{selectedIds.length}</b><small>человек назначено</small></div><em>{members.filter((member) => member.role === 'worker' && selectedIds.includes(member.id)).length} рабочих</em></div>
    <label className="object-team-editor__search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти сотрудника" aria-label="Поиск сотрудника" /></label>
    <div className="object-team-editor__list">
      {status === 'loading' ? <div className="object-team-editor__state"><LoaderCircle className="spin" size={20} />Загружаем команду</div> : null}
      {status === 'error' ? <div className="object-team-editor__state is-error"><AlertTriangle size={20} />Команда временно недоступна</div> : null}
      {status === 'ready' ? visibleMembers.map((member) => {
        const selected = selectedIds.includes(member.id)
        const shiftObject = objects.find((item) => item.id === member.todayObjectId)
        const statusLabel = member.todayStatus === 'on_shift'
          ? member.todayObjectId === object.id ? 'На смене здесь' : `На смене${shiftObject ? ` · ${shiftObject.name}` : ''}`
          : member.todayStatus === 'shift_completed' ? 'Смена завершена' : 'Сегодня не выходил'
        return <button className={selected ? 'is-selected' : ''} type="button" onClick={() => toggle(member.id)} aria-pressed={selected} key={member.id}>
          <span className={`object-team-editor__avatar object-team-editor__avatar--${member.role}`}>{member.initials}</span>
          <span><b>{member.displayName}</b><small>{memberRoleLabels[member.role]}</small><em className={`is-${member.todayStatus}`}><i />{statusLabel}</em></span>
          <strong>{selected ? <CheckCircle2 size={20} /> : <Plus size={19} />}</strong>
        </button>
      }) : null}
      {status === 'ready' && visibleMembers.length === 0 ? <div className="object-team-editor__state"><Search size={20} />Сотрудники не найдены</div> : null}
    </div>
    {error ? <div className="object-team-editor__error" role="alert"><AlertTriangle size={17} />{error}</div> : null}
    <footer><button type="button" onClick={onClose} disabled={saving}>Отмена</button><button type="button" onClick={() => void save()} disabled={saving || status !== 'ready'}>{saving ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}{saving ? 'Сохраняем…' : 'Сохранить состав'}</button></footer>
  </aside></div>
}

function monthDateRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const from = `${month}-01`
  const to = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10)
  return { from, to }
}

function formatHistoryDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' }).replace('.', '')
}

function MemberProfileView({ memberId, objects, onBack }: { memberId: string; objects: ObjectSummary[]; onBack: () => void }) {
  const [month, setMonth] = useState(() => new Date().toLocaleDateString('sv-SE').slice(0, 7))
  const [history, setHistory] = useState<MemberTimesheetHistoryResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<TimesheetDayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const { from, to } = monthDateRange(month)
    setStatus('loading')
    setError(null)
    loadMemberTimesheetHistory(memberId, from, to, controller.signal)
      .then((response) => { setHistory(response); setStatus('ready') })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить карточку сотрудника.')
        setStatus('error')
      })
    return () => controller.abort()
  }, [memberId, month])

  const openDay = async (shiftId: string) => {
    setDetailLoading(true)
    try { setDetail((await loadTimesheetDay(shiftId)).day) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось открыть день табеля.') }
    finally { setDetailLoading(false) }
  }

  const member = history?.member
  const assignedObjects = member ? objects.filter((object) => member.objectIds.includes(object.id)) : []
  const todayObject = member?.todayObjectId ? objects.find((object) => object.id === member.todayObjectId) : undefined
  const todayLabel = member?.todayStatus === 'on_shift'
    ? `На смене${todayObject ? ` · ${todayObject.name}` : ''}`
    : member?.todayStatus === 'shift_completed'
      ? 'Смена завершена'
      : member?.todayStatus === 'not_started'
        ? 'Сегодня не выходил'
        : 'Владелец организации'

  return <section className="contractor-page employee-profile">
    <header className="contractor-page__hero employee-profile__hero">
      <div><span>Сотрудник и рабочее время</span><h1>{member?.displayName ?? 'Карточка сотрудника'}</h1><p>{member ? `${memberRoleLabels[member.role]} · ${member.specialization ?? memberSpecializations[member.role]}` : 'Загружаем профиль и историю смен.'}</p></div>
      <button type="button" onClick={onBack}><ArrowLeft size={18} />Назад</button>
    </header>

    {history ? <div className="contractor-page__summary employee-profile__summary" aria-label="Сводка по сотруднику">
      <article><span className="is-blue"><CalendarDays size={19} /></span><div><b>{history.summary.shiftCount}</b><small>смен за период</small></div></article>
      <article><span className="is-green"><CheckCircle2 size={19} /></span><div><b>{history.summary.completedCount}</b><small>завершено</small></div></article>
      <article><span className="is-orange"><Clock3 size={19} /></span><div><b>{formatWorkedMinutes(history.summary.workedMinutes)}</b><small>фактическое время</small></div></article>
      <article><span className="is-cyan"><Building2 size={19} /></span><div><b>{history.summary.objectCount}</b><small>объектов в истории</small></div></article>
    </div> : null}

    <div className="contractor-page__toolbar employee-profile__toolbar">
      <div><b>История смен</b><small>{history ? `${history.from} — ${history.to}` : 'Выбранный месяц'}</small></div>
      <label><CalendarDays size={17} /><span>Период</span><input type="month" value={month} max={new Date().toLocaleDateString('sv-SE').slice(0, 7)} onChange={(event) => setMonth(event.target.value)} aria-label="Месяц истории смен" /></label>
    </div>

    {error ? <div className="employee-profile__error" role="alert"><AlertTriangle size={18} />{error}</div> : null}
    {!history && status === 'loading' ? <div className="employee-profile__state"><LoaderCircle className="spin" size={22} />Загружаем карточку сотрудника</div> : null}
    {!history && status === 'error' ? <div className="employee-profile__state"><UserRound size={24} />Карточка сотрудника временно недоступна<button type="button" onClick={onBack}>Вернуться к списку</button></div> : null}

    {history && member ? <div className="employee-profile__layout">
      <aside className="employee-profile__identity">
        <header><span className={`employee-profile__avatar employee-profile__avatar--${member.role}`}>{member.initials}</span><div><small>{memberRoleLabels[member.role]}</small><h2>{member.displayName}</h2><em className={`team-member-card__status team-member-card__status--${member.todayStatus}`}><i />{todayLabel}</em></div></header>
        <a href={`tel:${member.phone}`}><Phone size={17} /><span><small>Телефон</small><b>{formatMemberPhone(member.phone)}</b></span></a>
        <section><header><span>Назначения</span><b>{member.role === 'contractor' ? 'Все объекты' : assignedObjects.length}</b></header><div>{member.role === 'contractor' ? <span className="employee-profile__scope"><CheckCircle2 size={15} />Доступ ко всем объектам</span> : assignedObjects.length ? assignedObjects.map((object) => <span className="employee-profile__scope" key={object.id}><Building2 size={15} /><b>{object.name}</b><small>{object.code}</small></span>) : <span className="employee-profile__scope is-empty">Объекты не назначены</span>}</div></section>
        <footer><CheckCircle2 size={16} />Данные профиля получены с сервера</footer>
      </aside>

      <section className="employee-profile__history" aria-busy={status === 'loading'}>
        {status === 'loading' ? <div className="employee-profile__refresh"><LoaderCircle className="spin" size={17} />Обновляем период</div> : null}
        {history.days.length ? <div className="employee-history-list">{history.days.map((day) => <button type="button" onClick={() => void openDay(day.shiftId)} key={day.shiftId}>
          <time>{formatHistoryDate(day.date)}</time>
          <span className="employee-history-list__object"><Building2 size={16} /><span><b>{day.objectName}</b><small>{day.objectCode}</small></span></span>
          <span><small>Приход</small><b>{formatShiftTime(day.startedAt)}</b></span>
          <span><small>Уход</small><b>{day.endedAt ? formatShiftTime(day.endedAt) : '—'}</b></span>
          <span><small>Факт</small><b>{formatWorkedMinutes(day.workedMinutes)}</b></span>
          <em className={`timesheet-status timesheet-status--${day.status}`}>{day.status === 'complete' ? 'Завершена' : 'Идёт'}</em>
          <ChevronRight size={17} />
        </button>)}</div> : <div className="employee-profile__empty"><Clock3 size={25} /><h2>Смен за этот месяц нет</h2><p>Выберите другой период или дождитесь первой отметки сотрудника.</p></div>}
      </section>
    </div> : null}

    {detailLoading ? <div className="timesheet-detail-loading"><LoaderCircle className="spin" /></div> : null}
    {detail ? <TimesheetDetail day={detail} onClose={() => setDetail(null)} /> : null}
  </section>
}

function TimesheetView({ compact = false, search = '', onOpenMember }: { compact?: boolean; search?: string; onOpenMember?: (memberId: string) => void }) {
  const [date, setDate] = useState(() => new Date().toLocaleDateString('sv-SE'))
  const [days, setDays] = useState<TimesheetDaySummary[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [detail, setDetail] = useState<TimesheetDayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    loadTimesheetDays(date, controller.signal).then((response) => { setDays(response.days); setStatus('ready') }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [date])
  const query = search.trim().toLocaleLowerCase('ru-RU')
  const visibleDays = query ? days.filter((day) => `${day.userName} ${day.objectName} ${day.objectCode}`.toLocaleLowerCase('ru-RU').includes(query)) : days
  const completed = days.filter((day) => day.status === 'complete').length
  const totalMinutes = days.reduce((sum, day) => sum + day.workedMinutes, 0)
  const openDetail = async (shiftId: string) => {
    setDetailLoading(true)
    try { setDetail((await loadTimesheetDay(shiftId)).day) }
    catch { setStatus('error') }
    finally { setDetailLoading(false) }
  }
  return <section className={`timesheet-view ${compact ? 'timesheet-view--compact' : 'contractor-page contractor-timesheet'}`}>
    <header className={`timesheet-view__hero ${compact ? '' : 'contractor-page__hero'}`}>
      <div><span>{compact ? 'Команда сегодня' : 'Учёт рабочего времени'}</span><h1>{compact ? 'Смены команды' : 'Дневной табель'}</h1><p>{compact ? 'Фактические отметки в вашей области.' : 'Приход, уход и длительность по первичным событиям смен.'}</p></div>
      <label className="timesheet-date"><CalendarDays size={18} /><span>Дата</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Дата табеля" /></label>
    </header>
    <div className={`timesheet-summary ${compact ? '' : 'contractor-page__summary'}`} aria-label="Сводка по табелю">
      <article><span className="is-blue"><Users size={19} /></span><span><b>{days.length}</b><small>смен за день</small></span></article>
      <article><span className="is-green"><CheckCircle2 size={19} /></span><span><b>{completed}</b><small>завершено</small></span></article>
      <article><span className="is-orange"><Clock3 size={19} /></span><span><b>{formatWorkedMinutes(totalMinutes)}</b><small>общее время</small></span></article>
    </div>
    {!compact ? <div className="contractor-page__toolbar timesheet-toolbar"><div><b>{query ? `Найдено: ${visibleDays.length}` : 'Все смены'}</b><small>{visibleDays.length} {visibleDays.length === 1 ? 'запись' : visibleDays.length > 1 && visibleDays.length < 5 ? 'записи' : 'записей'} за выбранный день</small></div><span><i />Данные сервера</span></div> : null}
    {status === 'loading' ? <div className="timesheet-state"><LoaderCircle className="spin" size={20} />Загружаем табель</div> : status === 'error' ? <div className="timesheet-state timesheet-state--error"><AlertTriangle size={20} />Не удалось загрузить табель</div> : visibleDays.length ? <div className="timesheet-list">{visibleDays.map((day) => <button type="button" onClick={() => void openDetail(day.shiftId)} key={day.shiftId}><span className="timesheet-avatar">{day.userInitials}</span><span className="timesheet-person"><b>{day.userName}</b><small>{day.objectName} · {day.objectCode}</small></span><span><small>Приход</small><b>{formatShiftTime(day.startedAt)}</b></span><span><small>Уход</small><b>{day.endedAt ? formatShiftTime(day.endedAt) : '—'}</b></span><span><small>Время</small><b>{formatWorkedMinutes(day.workedMinutes)}</b></span><em className={`timesheet-status timesheet-status--${day.status}`}>{day.status === 'complete' ? 'Завершена' : 'Идёт'}</em><ChevronRight size={17} /></button>)}</div> : <div className="timesheet-state"><Clock3 size={20} />За выбранную дату смен нет</div>}
    {detailLoading ? <div className="timesheet-detail-loading"><LoaderCircle className="spin" /></div> : null}
    {detail ? <TimesheetDetail day={detail} onClose={() => setDetail(null)} onOpenMember={onOpenMember ? () => { setDetail(null); onOpenMember(detail.userId) } : undefined} /> : null}
  </section>
}

function TimesheetDetail({ day, onClose, onOpenMember }: { day: TimesheetDayDetail; onClose: () => void; onOpenMember?: () => void }) {
  return <div className="timesheet-detail-backdrop"><section className="timesheet-detail" role="dialog" aria-modal="true" aria-labelledby="timesheet-detail-title"><header><div><span>{day.date}</span><h2 id="timesheet-detail-title">{day.userName}</h2><p>{day.objectName} · {day.objectCode}</p></div><button type="button" onClick={onClose} aria-label="Закрыть">×</button></header><div className="timesheet-detail__metrics"><span><small>Приход</small><b>{formatShiftTime(day.startedAt)}</b></span><span><small>Уход</small><b>{day.endedAt ? formatShiftTime(day.endedAt) : '—'}</b></span><span><small>Фактически</small><b>{formatWorkedMinutes(day.workedMinutes)}</b></span></div><h3>События дня</h3><ol>{day.events.map((event) => <li key={event.id}><i className={event.type === 'shift_started' ? 'is-start' : 'is-end'} /><time>{formatShiftTime(event.occurredAtDevice)}</time><span><b>{event.type === 'shift_started' ? 'Смена начата' : 'Смена завершена'}</b><small>{event.method === 'qr_scan' ? 'QR-код объекта' : 'Подтверждено вручную'}</small></span></li>)}</ol>{onOpenMember ? <button className="timesheet-detail__member" type="button" onClick={onOpenMember}><UserRound size={17} />Открыть карточку сотрудника<ChevronRight size={16} /></button> : null}<footer><CheckCircle2 size={17} />Первичные события сохранены на сервере</footer></section></div>
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
  const [shift, setShift] = useState<Awaited<ReturnType<typeof loadTodayShift>>['shift']>(null)
  const [showQr, setShowQr] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  useEffect(() => { void loadTodayShift().then((result) => setShift(result.shift)).catch(() => undefined) }, [])
  const now = new Date()
  const dateLabel = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const start = async (token: string) => { if (!object) return false; try { const result = await startShift({ objectId: object.id, qrToken: token, occurredAtDevice: new Date().toISOString() }); setShift(result.shift); setShowQr(false); setQrToken(''); setNotice('Смена начата — QR-код подтверждён'); return true } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось начать смену'); return false } }
  const finish = async () => {
    setEnding(true)
    try {
      const result = await endShift({ occurredAtDevice: new Date().toISOString() })
      setShift(result.shift)
      setShowEnd(false)
      setNotice('Смена завершена — день добавлен в табель')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось завершить смену')
    } finally { setEnding(false) }
  }
  const shiftState = shift?.status === 'open' ? 'active' : shift?.status === 'closed' ? 'finished' : 'idle'
  const shiftObjectName = shift?.objectName ?? object?.name ?? 'Объект не назначен'
  const shiftObjectCode = shift?.objectCode ?? object?.code ?? ''
  const shiftTitle = shiftState === 'active' ? 'Смена идёт' : shiftState === 'finished' ? 'Смена завершена' : 'Смена не начата'
  const shiftDetail = shiftState === 'active' ? `Начата в ${formatShiftTime(shift!.startedAtServer)} · идёт сейчас` : shiftState === 'finished' ? `${formatShiftTime(shift!.startedAtServer)}–${formatShiftTime(shift!.endedAtServer!)} · ${formatWorkedMinutes(shift!.workedMinutes)}` : 'Готово к началу рабочего дня'
  const workerFirstName = context.user.firstName ?? context.user.displayName.split(' ')[1] ?? context.user.displayName
  return <main className="mobile-shell"><section className="phone-app worker-home"><header className="mobile-header"><Brand compact /><div><button type="button" aria-label="Уведомления"><Bell size={20} /></button><span>{context.user.initials}</span></div></header><div className="mobile-content worker-home__content"><section className="worker-welcome"><span>{dateLabel}</span><h1>Доброе утро, {workerFirstName}</h1></section><section className="worker-day-hero"><header className="worker-day-hero__summary"><div className="worker-day-hero__time"><time>{now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time></div><div className="worker-day-hero__weather"><img src="/graphics/weather/weather-sunny-3d.png" alt="Погода: ясно" /><span><strong>+18°</strong><small>Ясно</small></span></div></header><div className={`worker-day-hero__shift worker-day-hero__shift--${shiftState}`}><div className="worker-day-hero__shift-copy"><img src={`/graphics/shift/shift-${shiftState}-apple.png`} alt="" /><span><small>{shiftObjectName} · {shiftObjectCode}</small><b>{shiftTitle}</b><em>{shiftDetail}</em></span></div>{shiftState === 'active' ? <SwipeAction label="Свайп, чтобы завершить смену" onComplete={() => setShowEnd(true)} /> : shiftState === 'finished' ? <div className="worker-shift-finished"><CheckCircle2 size={17} /><span><b>День сформирован</b><small>Сохранён в табеле</small></span></div> : <SwipeAction label="Свайп, чтобы начать смену" onComplete={() => setShowQr(true)} />}</div></section></div><nav className="mobile-nav">{context.navigation.slice(0, 4).map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={19} /><span>{item.label}</span></button> })}</nav>{showQr ? <QrModal objectName={object?.name} onClose={() => setShowQr(false)} qrToken={qrToken} onToken={setQrToken} onSubmit={start} /> : null}{showEnd && shift?.status === 'open' ? <EndShiftModal shift={shift} busy={ending} onClose={() => setShowEnd(false)} onConfirm={() => void finish()} /> : null}{notice ? <button className="worker-toast" type="button" onClick={() => setNotice(null)}>{notice}</button> : null}</section></main>
}

function formatShiftTime(value: string) { return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
function formatWorkedMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? `${hours} ч ${rest} мин` : `${rest} мин` }

function EndShiftModal({ shift, busy, onClose, onConfirm }: { shift: NonNullable<Awaited<ReturnType<typeof loadTodayShift>>['shift']>; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const estimatedMinutes = Math.max(0, Math.floor((Date.now() - new Date(shift.startedAtServer).getTime()) / 60000))
  return <div className="qr-modal-backdrop"><section className="qr-modal shift-end-modal" role="dialog" aria-modal="true" aria-labelledby="shift-end-title"><button className="qr-modal__close" type="button" onClick={onClose} disabled={busy} aria-label="Закрыть">×</button><span className="shift-end-modal__icon"><Clock3 size={23} /></span><h2 id="shift-end-title">Завершить смену?</h2><p>Проверьте итог рабочего дня перед подтверждением.</p><dl className="shift-end-summary"><div><dt>Объект</dt><dd>{shift.objectName}</dd></div><div><dt>Начало</dt><dd>{formatShiftTime(shift.startedAtServer)}</dd></div><div><dt>Сейчас</dt><dd>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</dd></div><div className="shift-end-summary__total"><dt>Рабочее время</dt><dd>{formatWorkedMinutes(estimatedMinutes)}</dd></div></dl><p className="shift-end-modal__hint">Незаполненные задачи не блокируют завершение смены и останутся в истории дня.</p><button className="qr-modal__submit" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Завершаем…' : 'Подтвердить завершение'}</button></section></div>
}

type QrCameraState = 'requesting' | 'scanning' | 'unsupported' | 'denied' | 'detected'

function QrModal({ objectName, onClose, qrToken, onToken, onSubmit }: { objectName?: string; onClose: () => void; qrToken: string; onToken: (value: string) => void; onSubmit: (token: string) => Promise<boolean> }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const submitRef = useRef(onSubmit)
  const busyRef = useRef(false)
  const [cameraState, setCameraState] = useState<QrCameraState>('requesting')
  submitRef.current = onSubmit
  useEffect(() => {
    let active = true
    let stream: MediaStream | undefined
    let timer: number | undefined
    const run = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (!active || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        const Detector = (window as Window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
        if (!Detector) { setCameraState('unsupported'); return }
        const detector = new Detector({ formats: ['qr_code'] })
        setCameraState('scanning')
        const scan = async () => {
          if (!active) return
          try {
            if (!busyRef.current && videoRef.current?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
              const code = (await detector.detect(videoRef.current))[0]?.rawValue?.trim()
              if (code) {
                busyRef.current = true
                setCameraState('detected')
                onToken(code)
                const accepted = await submitRef.current(code)
                if (!accepted && active) { busyRef.current = false; setCameraState('scanning') }
              }
            }
          } catch { /* continue scanning transient unreadable frames */ }
          timer = window.setTimeout(() => void scan(), 350)
        }
        void scan()
      } catch (error) {
        setCameraState(error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError') ? 'denied' : 'unsupported')
      }
    }
    void run()
    return () => { active = false; if (timer) window.clearTimeout(timer); stream?.getTracks().forEach((track) => track.stop()) }
  }, [onToken])
  const cameraCopy = cameraState === 'requesting' ? 'Запрашиваем доступ к камере…' : cameraState === 'scanning' ? 'Наведите камеру на QR-код' : cameraState === 'detected' ? 'QR-код найден. Проверяем…' : cameraState === 'denied' ? 'Доступ к камере запрещён' : 'Автосканирование недоступно в этом браузере'
  return <div className="qr-modal-backdrop"><section className="qr-modal" role="dialog" aria-modal="true"><button className="qr-modal__close" type="button" onClick={onClose} aria-label="Закрыть">×</button><span className="qr-modal__icon">▦</span><h2>Отсканируйте QR-код</h2><p>Наведите камеру на QR-код объекта «{objectName ?? '—'}».</p><div className={`qr-camera-placeholder qr-camera-placeholder--${cameraState}`}><video ref={videoRef} muted playsInline /><span className="qr-camera-frame" aria-hidden="true" /><strong>{cameraCopy}</strong></div><label>Если камера недоступна, введите код<input value={qrToken} onChange={(event) => onToken(event.target.value)} placeholder="SMENA-QR-…" /></label><button className="qr-modal__submit" type="button" disabled={!qrToken.trim() || busyRef.current} onClick={() => { busyRef.current = true; setCameraState('detected'); void submitRef.current(qrToken.trim()).then((accepted) => { if (!accepted) { busyRef.current = false; setCameraState('scanning') } }) }}>{cameraState === 'detected' ? 'Проверяем…' : 'Подтвердить QR'}</button></section></div>
}

function MobileWorkspace({ context, kind }: { context: MeContextResponse; kind: 'foreman' | 'worker' }) {
  const object = context.objects[0]
  return <main className="mobile-shell"><section className="phone-app"><header className="mobile-header"><Brand compact /><div><button type="button" aria-label="Уведомления"><Bell size={19} /></button><span>{context.user.initials}</span></div></header><div className="mobile-content foreman-content"><span className="mobile-eyebrow">{roleLabels[context.user.role]} · {context.organization.name}</span><h1>{kind === 'foreman' ? 'Контроль объектов' : 'Рабочий день'}</h1><p>{context.user.displayName}</p><section className="access-card"><span><CheckCircle2 size={20} /></span><div><small>Зона ответственности</small><b>{context.objects.length} {context.objects.length === 1 ? 'объект' : 'объекта'}</b><p>Здесь показаны назначенные вам стройплощадки.</p></div></section>{object ? <article className="mobile-object"><header><span><Building2 size={19} /></span><em>{object.code}</em></header><h2>{object.name}</h2><dl><div><dt>На объекте</dt><dd>{object.presentWorkers}/{object.plannedWorkers}</dd></div><div><dt>План дня</dt><dd>{object.dayProgress}%</dd></div><div><dt>Проблемы</dt><dd>{object.issueCount}</dd></div></dl></article> : null}{kind === 'foreman' ? <TimesheetView compact /> : null}</div><nav className="mobile-nav">{context.navigation.map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={19} /><span>{item.label}</span></button> })}</nav></section></main>
}
