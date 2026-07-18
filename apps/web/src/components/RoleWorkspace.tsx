import type { MeContextResponse, NavigationKey } from '@smena/contracts'
import {
  AlertTriangle, BarChart3, Bell, Building2, CheckCircle2, ClipboardList,
  Clock3, FileText, HardHat, Home, LogOut, MessageCircle, Plus, Settings, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Brand } from './Brand'

const navigationIcons: Record<NavigationKey, LucideIcon> = {
  overview: Home, objects: Building2, team: Users, tasks: ClipboardList,
  timesheet: Clock3, reports: BarChart3, today: Home, messages: MessageCircle, profile: Settings,
}

const roleLabels = { contractor: 'Подрядчик', foreman: 'Бригадир', worker: 'Рабочий' } as const

export function RoleWorkspace({ context, onLogout }: { context: MeContextResponse; onLogout: () => void }) {
  if (context.user.role === 'contractor') return <ContractorSessionWorkspace context={context} onLogout={onLogout} />
  if (context.user.role === 'foreman') return <MobileSessionWorkspace context={context} kind="foreman" onLogout={onLogout} />
  return <MobileSessionWorkspace context={context} kind="worker" onLogout={onLogout} />
}

function ContractorSessionWorkspace({ context, onLogout }: { context: MeContextResponse; onLogout: () => void }) {
  return <div className="contractor-session-frame"><button className="contractor-mobile-exit" type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={17} /></button><ContractorWorkspace context={context} onLogout={onLogout} /></div>
}

function MobileSessionWorkspace({ context, kind, onLogout }: { context: MeContextResponse; kind: 'foreman' | 'worker'; onLogout: () => void }) {
  return <div className="mobile-session-frame"><button className="mobile-session-exit" type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={17} /></button><MobileWorkspace context={context} kind={kind} /></div>
}

function ContractorWorkspace({ context, onLogout }: { context: MeContextResponse; onLogout: () => void }) {
  const peoplePresent = context.objects.reduce((sum, object) => sum + object.presentWorkers, 0)
  const peoplePlanned = context.objects.reduce((sum, object) => sum + object.plannedWorkers, 0)
  const issueCount = context.objects.reduce((sum, object) => sum + object.issueCount, 0)
  const averageProgress = Math.round(context.objects.reduce((sum, object) => sum + object.dayProgress, 0) / Math.max(context.objects.length, 1))

  return (
    <div className="contractor-app">
      <aside className="contractor-sidebar">
        <Brand />
        <div className="organization-card"><span>{context.organization.name.slice(0, 2).toUpperCase()}</span><div><b>{context.organization.name}</b><small>{context.objects.length} активных объекта</small></div></div>
        <nav>{context.navigation.map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={18} /><span>{item.label}</span></button> })}</nav>
        <div className="sidebar-user"><span>{context.user.initials}</span><div><b>{context.user.displayName}</b><small>{roleLabels[context.user.role]}</small></div><button type="button" onClick={onLogout} aria-label="Выйти"><LogOut size={16} /></button></div>
      </aside>
      <main className="contractor-main">
        <header className="contractor-topbar"><label><span className="sr-only">Поиск</span><input placeholder="Найти сотрудника, задачу или объект" /></label><button className="icon-action" type="button" aria-label="Уведомления"><Bell size={19} /><i>{issueCount}</i></button><button className="primary-action" type="button"><Plus size={17} />Новая задача</button></header>
        <div className="contractor-content">
          <section className="welcome"><div><span>Оперативная сводка</span><h1>Доброе утро, {context.user.displayName.split(' ')[0]}</h1><p>Данные ограничены организацией и объектами из серверного контекста.</p></div><em><CheckCircle2 size={16} />Контекст API загружен</em></section>
          <section className="metrics" aria-label="Оперативные показатели">
            <Metric icon={Users} label="Люди на смене" value={peoplePresent} note={`из ${peoplePlanned} по плану`} tone="blue" />
            <Metric icon={HardHat} label="Объекты доступны" value={context.objects.length} note="по правам пользователя" tone="green" />
            <Metric icon={ClipboardList} label="План дня" value={`${averageProgress}%`} note="среднее по объектам" tone="violet" />
            <Metric icon={AlertTriangle} label="Требует решения" value={issueCount} note="проблем на объектах" tone="orange" />
          </section>
          <section className="objects-section"><header><div><span>Стройплощадки</span><h2>Доступные объекты</h2></div><small>Источник: GET /api/v1/me/context</small></header><div className="object-grid">{context.objects.map((object) => <article key={object.id}><div className="object-card-top"><span><Building2 size={20} /></span><em>{object.issueCount ? `${object.issueCount} проблемы` : 'Без блокировок'}</em></div><h3>{object.name}</h3><p>{object.code}</p><dl><div><dt>На объекте</dt><dd>{object.presentWorkers}<small>/{object.plannedWorkers}</small></dd></div><div><dt>План дня</dt><dd>{object.dayProgress}%</dd></div></dl><div className="progress"><i style={{ width: `${object.dayProgress}%` }} /></div><button type="button">Открыть объект</button></article>)}</div></section>
        </div>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: string | number; note: string; tone: string }) {
  return <article className={`metric metric--${tone}`}><header><span><Icon size={18} /></span><b>{label}</b></header><strong>{value}</strong><p>{note}</p></article>
}

function MobileWorkspace({ context, kind }: { context: MeContextResponse; kind: 'foreman' | 'worker' }) {
  const object = context.objects[0]
  return <main className="mobile-shell"><section className="phone-app"><header className="mobile-header"><Brand compact /><div><button type="button" aria-label="Уведомления"><Bell size={19} /></button><span>{context.user.initials}</span></div></header><div className="mobile-content"><span className="mobile-eyebrow">{roleLabels[context.user.role]} · {context.organization.name}</span><h1>{kind === 'foreman' ? 'Контроль объектов' : 'Рабочий день'}</h1><p>{context.user.displayName}</p><section className="access-card"><span><CheckCircle2 size={20} /></span><div><small>Серверный контекст</small><b>{context.objects.length} {context.objects.length === 1 ? 'доступный объект' : 'доступных объекта'}</b><p>Интерфейс построен только из разрешённых данных.</p></div></section>{object ? <article className="mobile-object"><header><span><Building2 size={19} /></span><em>{object.code}</em></header><h2>{object.name}</h2><dl><div><dt>На объекте</dt><dd>{object.presentWorkers}/{object.plannedWorkers}</dd></div><div><dt>План дня</dt><dd>{object.dayProgress}%</dd></div><div><dt>Проблемы</dt><dd>{object.issueCount}</dd></div></dl></article> : null}<section className="next-slice"><FileText size={20} /><div><small>Следующий вертикальный срез</small><b>{kind === 'worker' ? 'Начало и завершение смены' : 'Явка команды в реальном времени'}</b></div></section></div><nav className="mobile-nav">{context.navigation.map((item, index) => { const Icon = navigationIcons[item.key]; return <button className={index === 0 ? 'is-active' : ''} type="button" key={item.key}><Icon size={19} /><span>{item.label}</span></button> })}</nav></section></main>
}
