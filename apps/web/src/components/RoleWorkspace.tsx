import type { MeContextResponse, NavigationKey, ObjectSummary } from '@smena/contracts'
import {
  AlertTriangle, ArrowUpRight, BarChart3, Bell, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardList, Clock3, Download, FileText, HardHat, Home,
  LogOut, Menu, MessageCircle, MoreHorizontal, Plus, Search, Settings, SlidersHorizontal, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
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
        <nav aria-label="Кабинет подрядчика">{context.navigation.map((item, index) => { const Icon = navigationIcons[item.key]; return <button type="button" className={index === 0 ? 'is-active' : ''} onClick={() => index ? notify(`${item.label}: следующий экран production-карты`) : undefined} key={item.key}><Icon size={19} strokeWidth={2.1} /><span>{item.label}</span>{item.key === 'tasks' && issueCount ? <small>{issueCount}</small> : null}</button> })}</nav>
        <div className="contractor-sidebar__footer"><button type="button" onClick={() => notify('Настройки будут подключены отдельным срезом')}><Settings size={19} />Настройки</button><div className="contractor-profile"><span className="contractor-avatar">{context.user.initials}</span><span><b>{context.user.displayName}</b><small>Подрядчик</small></span><button type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={18} /></button></div></div>
      </aside>

      <div className="contractor-workspace">
        <header className="contractor-topbar">
          <button className="contractor-menu" type="button" aria-label="Открыть меню" onClick={() => notify('Меню разделов')}><Menu size={21} /></button><div className="contractor-mobile-brand"><Brand compact /></div>
          <label className="contractor-search"><Search size={18} /><input aria-label="Поиск" placeholder="Найти объект" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="contractor-topbar__actions"><button className="contractor-date" type="button" onClick={() => notify('Показываем оперативные данные за сегодня')}><CalendarDays size={17} />Сегодня<ChevronDown size={15} /></button><button className="contractor-icon-button" type="button" aria-label="Уведомления" onClick={() => notify(`${issueCount} событий требуют внимания`)}><Bell size={20} />{issueCount ? <i>{issueCount}</i> : null}</button><button className="contractor-create" type="button" onClick={() => notify('Создание задачи начнётся в S01')}><Plus size={19} /><span>Новая задача</span></button></div>
        </header>

        <div className="contractor-content">
          <section className="contractor-welcome"><div><span>Оперативная сводка</span><h1>Доброе утро, {context.user.displayName.split(' ')[0]}</h1><p>На {context.objects.length} объектах работают {peoplePresent} человек. {issueCount ? `${issueCount} события требуют решения.` : 'Событий, требующих решения, нет.'}</p></div><div className="contractor-welcome__sync"><CheckCircle2 size={16} /><span><b>Данные актуальны</b><small>PostgreSQL · обновлено сейчас</small></span></div></section>

          <section className="contractor-metrics" aria-label="Оперативные показатели">{metrics.map(({ label, value, suffix, detail, note, badge, progress, tone, icon: Icon, background }) => <article className={`contractor-metric contractor-metric--${tone}`} key={label}><img className="contractor-metric__background" src={background} alt="" aria-hidden="true" /><header className="contractor-metric__header"><span className="contractor-metric__icon"><Icon size={18} /></span><span className="contractor-metric__label">{label}</span><span className="contractor-metric__badge">{badge}</span></header><div className="contractor-metric__value"><strong>{value}</strong><span>{suffix}</span></div><p className="contractor-metric__detail">{detail}</p><footer className="contractor-metric__footer"><span>{note}</span>{typeof progress === 'number' ? <i aria-label={`${progress}%`}><b style={{ width: `${progress}%` }} /></i> : null}</footer></article>)}</section>

          <section className="contractor-section"><header><div><span>Стройплощадки</span><h2>Объекты сегодня</h2></div><button type="button" onClick={() => { setSearch(''); notify('Показаны все доступные объекты') }}>Все объекты<ChevronRight size={16} /></button></header><div className="contractor-objects">{filteredObjects.map((object, index) => <ContractorObjectCard object={object} index={index} onOpen={() => notify(`Открываем ${object.name}`)} key={object.id} />)}</div>{filteredObjects.length === 0 ? <div className="contractor-empty">По запросу «{search}» объекты не найдены.</div> : null}</section>

          <div className="contractor-dashboard-grid">
            <section className="contractor-panel contractor-panel--attention"><header><div><span>Приоритет</span><h2>Требует внимания</h2></div><strong>{issueCount}</strong></header><div className="contractor-attention-list">{attentionObjects.length ? attentionObjects.map((object) => <button type="button" onClick={() => notify(`Открываем события: ${object.name}`)} key={object.id}><span className="attention-dot attention-dot--critical"><AlertTriangle size={16} /></span><span><small>Контроль объекта</small><b>{object.issueCount} {object.issueCount === 1 ? 'событие требует' : 'события требуют'} решения</b><em>{object.name} · {object.code}</em></span><time>сейчас</time><ChevronRight size={16} /></button>) : <div className="contractor-panel-empty"><CheckCircle2 size={18} />Нет событий, требующих решения</div>}</div></section>
            <section className="contractor-panel contractor-panel--tasks"><header><div><span>План / факт</span><h2>Ход работ по объектам</h2></div><button type="button" onClick={() => notify('Фильтры подключим к задачам в S01')}><SlidersHorizontal size={17} />Фильтр</button></header><div className="contractor-task-list">{context.objects.map((object, index) => <button type="button" onClick={() => notify(`Открываем ход работ: ${object.name}`)} key={object.id}><span className={`task-tone task-tone--${index === 1 ? 'green' : index === 2 ? 'orange' : 'blue'}`} /><span className="contractor-task-list__name"><b>{object.name}</b><small>{object.code} · {object.presentWorkers} человек</small></span><span><small>План дня</small><b>100%</b></span><span><small>Факт</small><b>{object.dayProgress}%</b></span><span><small>Явка</small><b>{object.presentWorkers}/{object.plannedWorkers}</b></span><span className="contractor-task-list__progress"><i><em style={{ width: `${object.dayProgress}%` }} /></i><b>{object.dayProgress}%</b></span><ChevronRight size={16} /></button>)}</div><footer><button type="button" onClick={() => notify('Формирование сводки появится после S01')}><Download size={16} />Скачать сводку</button><button type="button" onClick={() => notify('Все задачи появятся в S01')}>Открыть все задачи<ArrowUpRight size={15} /></button></footer></section>
          </div>
        </div>
        <nav className="contractor-mobile-nav" aria-label="Навигация подрядчика"><button className="is-active" type="button"><Home size={19} /><span>Обзор</span></button><button type="button" onClick={() => notify('Объекты')}><Building2 size={19} /><span>Объекты</span></button><button type="button" onClick={() => notify('Задачи появятся в S01')}><ClipboardList size={19} /><span>Задачи</span>{issueCount ? <i>{issueCount}</i> : null}</button><button type="button" onClick={() => notify('Команда появится в F02')}><Users size={19} /><span>Команда</span></button></nav>
        {notice ? <div className="contractor-toast" role="status">{notice}</div> : null}
      </div>
    </section>
  )
}

function ContractorObjectCard({ object, index, onOpen }: { object: ObjectSummary; index: number; onOpen: () => void }) {
  const visual = objectVisuals[index % objectVisuals.length] ?? objectVisuals[0]
  return <article className={`contractor-object contractor-object--${visual.tone}`}><img className="contractor-object__background" src={visual.background} alt="" /><div className="contractor-object__top"><span>Активный объект</span><button type="button" aria-label={`Меню ${object.name}`}><MoreHorizontal size={18} /></button></div><div className="contractor-object__title"><span className="object-avatar"><Building2 size={19} /></span><div><h3>{object.name}</h3><p>{object.code}</p></div></div><div className="contractor-object__stats"><span><small>На объекте</small><b>{object.presentWorkers}<em>/{object.plannedWorkers}</em></b></span><span><small>План дня</small><b>{object.dayProgress}%</b></span><span className={object.issueCount ? 'has-issue' : ''}><small>Контроль</small><b>{object.issueCount ? `${object.issueCount} проблемы` : 'Без блокировок'}</b></span></div><button className="contractor-object__open" type="button" onClick={onOpen}>Открыть объект<ArrowUpRight size={16} /></button><span className="contractor-object__progress"><i style={{ width: `${object.dayProgress}%` }} /></span></article>
}

function MobileSessionWorkspace({ context, kind, onLogout }: { context: MeContextResponse; kind: 'foreman' | 'worker'; onLogout: () => void }) {
  return <div className="mobile-session-frame"><button className="mobile-session-exit" type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={17} /></button><MobileWorkspace context={context} kind={kind} /></div>
}

function MobileWorkspace({ context, kind }: { context: MeContextResponse; kind: 'foreman' | 'worker' }) {
  const object = context.objects[0]
  return <main className="mobile-shell"><section className="phone-app"><header className="mobile-header"><Brand compact /><div><button type="button" aria-label="Уведомления"><Bell size={19} /></button><span>{context.user.initials}</span></div></header><div className="mobile-content"><span className="mobile-eyebrow">{roleLabels[context.user.role]} · {context.organization.name}</span><h1>{kind === 'foreman' ? 'Контроль объектов' : 'Рабочий день'}</h1><p>{context.user.displayName}</p><section className="access-card"><span><CheckCircle2 size={20} /></span><div><small>Серверный контекст</small><b>{context.objects.length} {context.objects.length === 1 ? 'доступный объект' : 'доступных объекта'}</b><p>Интерфейс построен только из разрешённых данных.</p></div></section>{object ? <article className="mobile-object"><header><span><Building2 size={19} /></span><em>{object.code}</em></header><h2>{object.name}</h2><dl><div><dt>На объекте</dt><dd>{object.presentWorkers}/{object.plannedWorkers}</dd></div><div><dt>План дня</dt><dd>{object.dayProgress}%</dd></div><div><dt>Проблемы</dt><dd>{object.issueCount}</dd></div></dl></article> : null}<section className="next-slice"><FileText size={20} /><div><small>Следующий вертикальный срез</small><b>{kind === 'worker' ? 'Начало и завершение смены' : 'Явка команды в реальном времени'}</b></div></section></div><nav className="mobile-nav">{context.navigation.map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={19} /><span>{item.label}</span></button> })}</nav></section></main>
}
