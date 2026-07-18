import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BatteryFull,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  CloudOff,
  Coffee,
  Download,
  Database,
  FileText,
  HardHat,
  Home,
  ImagePlus,
  LayoutDashboard,
  Layers3,
  ListTodo,
  MapPin,
  Menu,
  MessageCircle,
  MonitorSmartphone,
  MoreHorizontal,
  Package,
  Phone,
  Play,
  Plus,
  Ruler,
  Route,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  Wifi,
  X,
} from 'lucide-react'

const workers = [
  { initials: 'ИИ', name: 'Иванов И.И.', trade: 'Плиточник', task: 'Укладка плитки', time: '08:02', state: 'online', tone: 'blue' },
  { initials: 'АС', name: 'Петров А.С.', trade: 'Арматурщик', task: 'Армирование стен', time: '08:15', state: 'late', tone: 'orange' },
  { initials: 'МВ', name: 'Сидоров М.В.', trade: 'Бетонщик', task: 'Монолитные работы', time: '08:01', state: 'online', tone: 'green' },
  { initials: 'ДА', name: 'Кузнецов Д.А.', trade: 'Разнорабочий', task: 'Подсобные работы', time: '07:58', state: 'offline', tone: 'slate' },
]

const workerWeatherStates = [
  {
    key: 'sunny',
    label: 'Солнечно',
    shortLabel: 'Солнце',
    temperature: '+18°',
    feelsLike: '+17°',
    precipitation: '0%',
    wind: '2 м/с',
    notice: 'Условия комфортные',
    noticeDetail: 'Можно работать без погодных ограничений.',
    noticeTone: 'safe',
    image: '/graphics/weather/weather-sunny-3d.png',
  },
  {
    key: 'cloudy',
    label: 'Облачно',
    shortLabel: 'Облака',
    temperature: '+14°',
    feelsLike: '+13°',
    precipitation: '15%',
    wind: '4 м/с',
    notice: 'Рабочий день без ограничений',
    noticeDetail: 'К вечеру возможен небольшой дождь.',
    noticeTone: 'neutral',
    image: '/graphics/weather/weather-cloudy-3d.png',
  },
  {
    key: 'rain',
    label: 'Дождь',
    shortLabel: 'Дождь',
    temperature: '+11°',
    feelsLike: '+8°',
    precipitation: '85%',
    wind: '6 м/с',
    notice: 'Осторожно: скользкие поверхности',
    noticeDetail: 'Проверьте обувь и открытые участки работ.',
    noticeTone: 'warning',
    image: '/graphics/weather/weather-rain-3d.png',
  },
  {
    key: 'wind',
    label: 'Сильный ветер',
    shortLabel: 'Ветер',
    temperature: '+15°',
    feelsLike: '+12°',
    precipitation: '10%',
    wind: '12 м/с',
    notice: 'Высотные работы — с осторожностью',
    noticeDetail: 'Согласуйте подъём с ответственным на объекте.',
    noticeTone: 'warning',
    image: '/graphics/weather/weather-wind-3d.png',
  },
]

const contractorMetrics = [
  {
    label: 'Люди на смене',
    value: '42',
    suffix: 'из 47 по плану',
    detail: 'Фактически вышли на объекты',
    note: '5 ещё не отметились',
    progress: 89,
    progressLabel: '89% явки',
    tone: 'blue',
    icon: Users,
    background: '/graphics/backgrounds/metric-workforce-3d.webp',
  },
  {
    label: 'Сейчас в работе',
    value: '36',
    suffix: 'человек',
    detail: 'Выполняют назначенные задачи',
    note: '4 на обеде · 2 без задачи',
    progress: 86,
    progressLabel: '86% заняты',
    tone: 'green',
    icon: HardHat,
    background: '/graphics/backgrounds/metric-active-work-3d.webp',
  },
  {
    label: 'Задачи дня',
    value: '34',
    suffix: 'из 50',
    detail: 'Выполнено и принято',
    note: '16 задач остаётся',
    progress: 68,
    progressLabel: '68% готово',
    tone: 'violet',
    icon: ListTodo,
    background: '/graphics/backgrounds/metric-tasks-3d.webp',
  },
  {
    label: 'Требует решения',
    value: '5',
    suffix: 'событий',
    detail: 'Ожидают вашей реакции',
    note: '2 блокируют работу · 3 ожидают ответа',
    progressLabel: 'Приоритет',
    tone: 'orange',
    icon: AlertTriangle,
    background: '/graphics/backgrounds/metric-attention-3d.webp',
  },
]

const contractorObjects = [
  { name: 'ЖК «Северный»', code: 'Корпус 4', people: '15', present: '13', progress: 72, issue: '2 проблемы', tone: 'blue', background: '/graphics/backgrounds/object-residential-3d-v2.webp' },
  { name: 'БЦ «Горизонт»', code: 'Секция А', people: '18', present: '17', progress: 84, issue: 'Без блокировок', tone: 'cyan', background: '/graphics/backgrounds/object-business-3d-v2.webp' },
  { name: 'Школа №18', code: 'Отделка', people: '14', present: '12', progress: 51, issue: '1 проблема', tone: 'orange', background: '/graphics/backgrounds/object-school-3d-v2.webp' },
]

const contractorAttention = [
  { type: 'Блокирует работу', title: 'Заканчивается плиточный клей', meta: 'ЖК «Северный» · Этаж 3', time: '7 мин', tone: 'critical' },
  { type: 'Проверка результата', title: 'Армирование стен · 18 м²', meta: 'БЦ «Горизонт» · Бригада №2', time: '24 мин', tone: 'review' },
  { type: 'Табель', title: 'Не закрыта смена Кузнецова Д.А.', meta: 'Школа №18 · вчера', time: '1 день', tone: 'warning' },
]

const issueStatuses = {
  open: { label: 'Открыта', short: 'Открыта', tone: 'open', step: 0 },
  accepted: { label: 'Принята', short: 'Принята', tone: 'accepted', step: 1 },
  in_progress: { label: 'В работе', short: 'В работе', tone: 'progress', step: 2 },
  resolved: { label: 'Решена', short: 'Решена', tone: 'resolved', step: 3 },
  closed: { label: 'Закрыта', short: 'Закрыта', tone: 'closed', step: 4 },
  reopened: { label: 'Открыта повторно', short: 'Повторно', tone: 'reopened', step: 0 },
}

const issueSteps = [
  { key: 'open', label: 'Открыта' },
  { key: 'accepted', label: 'Принята' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'resolved', label: 'Решена' },
  { key: 'closed', label: 'Закрыта' },
]

const contractorTasks = [
  { task: 'Укладка плитки', object: 'ЖК «Северный»', people: '5 человек', plan: '150 м²', reported: '96 м²', confirmed: '72 м²', progress: 64, tone: 'blue' },
  { task: 'Армирование стен', object: 'БЦ «Горизонт»', people: '3 человека', plan: '24 м²', reported: '18 м²', confirmed: '18 м²', progress: 75, tone: 'green' },
  { task: 'Подготовка основания', object: 'Школа №18', people: '4 человека', plan: '120 м²', reported: '62 м²', confirmed: '—', progress: 52, tone: 'orange' },
]

const workerQuickTasks = [
  { id: 'cleanup', example: 'simple', title: 'Убрать мусор в секции Б', detail: 'Выполнено после подготовки зоны', status: 'Готово', tone: 'done', icon: Check },
  { id: 'delivery', example: 'delivery', title: 'Принять материал', detail: '20 мешков клея · до 13:00', status: 'До 13:00', tone: 'time', icon: Package },
  { id: 'photo', example: 'photo', title: 'Сделать итоговую фотографию', detail: 'После завершения работ', status: 'Не начато', tone: 'pending', icon: Camera },
]

const navItems = {
  worker: [
    { label: 'Главная', icon: Home, key: 'home' },
    { label: 'Мои задачи', icon: ClipboardList, key: 'task' },
    { label: 'Сообщения', icon: MessageCircle, key: 'messages' },
    { label: 'Профиль', icon: UserRound, key: 'profile' },
  ],
  foreman: [
    { label: 'Сегодня', icon: Home, key: 'today', badge: 3 },
    { label: 'Команда', icon: Users, key: 'team' },
    { label: 'Задачи', icon: ClipboardList, key: 'tasks' },
    { label: 'Сообщения', icon: MessageCircle, key: 'messages' },
    { label: 'Ещё', icon: MoreHorizontal, key: 'more' },
  ],
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="СМЕНА">
      <img className="brand__mark-image" src="/graphics/svg/brand-mark.svg" alt="" />
      <span className="brand__name">СМЕНА</span>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <div className="status-bar__island" />
      <div className="status-bar__icons">
        <Signal size={14} strokeWidth={2.6} />
        <Wifi size={14} strokeWidth={2.6} />
        <BatteryFull size={16} strokeWidth={2.4} />
      </div>
    </div>
  )
}

function IconButton({ label, children, onClick, badge }) {
  return (
    <button className="icon-button" type="button" aria-label={label} onClick={onClick}>
      {children}
      {badge ? <span className="icon-button__badge">{badge}</span> : null}
    </button>
  )
}

function Avatar({ initials, tone = 'blue', small = false }) {
  return <span className={`avatar avatar--${tone} ${small ? 'avatar--small' : ''}`} aria-hidden="true">{initials}</span>
}

function ProgressRing({ value, size = 74 }) {
  return (
    <div className="progress-ring" style={{ '--progress': `${value * 3.6}deg`, width: size, height: size }}>
      <span>{value}%</span>
    </div>
  )
}

function BottomNav({ role, active, onNavigate }) {
  return (
    <nav className={`bottom-nav bottom-nav--${role}`} aria-label="Основная навигация">
      {navItems[role].map(({ label, icon: Icon, key, badge }) => (
        <button
          type="button"
          key={key}
          className={active === key ? 'is-active' : ''}
          onClick={() => onNavigate(key)}
        >
          <span className="bottom-nav__icon">
            <Icon size={20} strokeWidth={2.15} />
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function SyncPill({ online, queued = 0 }) {
  return (
    <div className={`sync-pill ${online ? 'sync-pill--online' : 'sync-pill--offline'}`}>
      {online ? <CheckCircle2 size={14} /> : <CloudOff size={14} />}
      <span>{online ? 'Синхронизировано' : queued > 0 ? `Сохранено на телефоне · ${queued}` : 'Работа без сети'}</span>
    </div>
  )
}

function SwipeAction({ label, onComplete, tone = 'blue' }) {
  const trackRef = useRef(null)
  const offsetRef = useRef(0)
  const draggingRef = useRef(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const getLimit = () => Math.max(0, (trackRef.current?.clientWidth || 0) - 54)

  const finishSwipe = () => {
    const limit = getLimit()
    if (limit > 0 && offsetRef.current >= limit * 0.72) {
      offsetRef.current = limit
      setOffset(limit)
      window.setTimeout(() => {
        onComplete()
        offsetRef.current = 0
        setOffset(0)
      }, 180)
    } else {
      offsetRef.current = 0
      setOffset(0)
    }
    draggingRef.current = false
    setDragging(false)
  }

  return (
    <div
      className={`swipe-action swipe-action--${tone} ${dragging ? 'is-dragging' : ''}`}
      ref={trackRef}
      role="button"
      tabIndex={0}
      aria-label={`${label}. Проведите вправо`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onComplete()
        }
      }}
    >
      <span className="swipe-action__label">{label}</span>
      <span
        className="swipe-action__thumb"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          draggingRef.current = true
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current || !trackRef.current) return
          const rect = trackRef.current.getBoundingClientRect()
          const next = event.clientX - rect.left - 27
          offsetRef.current = Math.max(0, Math.min(getLimit(), next))
          setOffset(offsetRef.current)
        }}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        aria-hidden="true"
      >
        <ArrowRight size={18} strokeWidth={2.6} />
      </span>
    </div>
  )
}

function WorkerHome({ shiftPhase, breakMode, breakCompleted, online, queued, onStartShift, onStartBreak, onFinishBreak, onFinishShift, onTask, onProblem, onNotifications, onNavigate }) {
  const weather = workerWeatherStates[0]
  const isIdle = shiftPhase === 'idle'
  const isActive = shiftPhase === 'active'
  const isBreak = shiftPhase === 'break'
  const isFinished = shiftPhase === 'finished'
  const stateCopy = isIdle
    ? { title: 'Смена не начата', detail: 'Готово к началу рабочего дня', tone: 'idle' }
    : isBreak
      ? { title: 'Вы на обеде', detail: 'Начат вручную в 12:15', tone: 'break' }
      : isFinished
        ? { title: 'Смена завершена', detail: online ? 'Отправлено · 18:00' : 'Сохранено на телефоне · 18:00', tone: 'finished' }
        : { title: 'Смена идёт', detail: online ? 'Начата в 07:54 · отправлено' : 'Начата в 07:54 · на телефоне', tone: 'active' }
  const shiftIcon = `/graphics/shift/shift-${stateCopy.tone}-apple.png`

  return (
    <div className="app-viewport">
      <StatusBar />
      <div className="screen-scroll worker-home">
        <header className="mobile-header">
          <Brand compact />
          <IconButton label="Уведомления" onClick={onNotifications} badge={2}><Bell size={21} /></IconButton>
        </header>

        {!online ? <SyncPill online={online} queued={queued} /> : null}

        <section className="worker-welcome app-enter app-enter--1">
          <div><span>Четверг, 23 мая</span><h1>Доброе утро, Алексей</h1></div>
        </section>

        <section className="worker-day-hero app-enter app-enter--2">
          <header className="worker-day-hero__summary">
            <div className="worker-day-hero__time"><time>09:41</time><span>Четверг, 23 мая</span></div>
            <div className="worker-day-hero__weather">
              <img src={weather.image} alt={`Погода на объекте: ${weather.label}`} />
              <span><strong>{weather.temperature}</strong><small>{weather.label}</small></span>
            </div>
          </header>
          <div className={`worker-day-hero__shift worker-day-hero__shift--${stateCopy.tone}`} aria-label={`Состояние смены: ${stateCopy.title}`}>
            <div className="worker-day-hero__shift-copy">
              <img src={shiftIcon} alt={`Иконка состояния: ${stateCopy.title}`} />
              <span><small>ЖК «Северный» · Корпус 4</small><b>{stateCopy.title}</b><em>{stateCopy.detail}</em></span>
            </div>
            {isIdle ? <SwipeAction label="Свайп, чтобы начать смену" onComplete={onStartShift} /> : null}
            {isActive ? <SwipeAction label="Свайп, чтобы завершить смену" onComplete={onFinishShift} /> : null}
            {isBreak ? <SwipeAction label="Свайп, чтобы продолжить" onComplete={onFinishBreak} tone="warm" /> : null}
            {isFinished ? <button className="worker-day-hero__day-link" type="button" onClick={() => onNavigate('day')}>Открыть мой день <ArrowRight size={15} /></button> : null}
          </div>
        </section>

        <section className="content-section worker-today app-enter app-enter--4">
          <div className="section-title-row worker-today__title"><div><span>План работ</span><h2>Задачи на сегодня</h2></div><span className="worker-today__count">4 задачи</span></div>
          <div className="worker-task-group worker-task-group--primary">
            <div className="worker-task-group__head"><span><i />Основная работа</span><em>1 задача</em></div>
            <button className="worker-primary-task" type="button" onClick={() => onTask('volume')} aria-label="Открыть основную задачу: Укладка плитки">
              <span className="worker-primary-task__head"><span>Объёмная задача</span><em>Нужна доработка</em></span>
              <span className="worker-primary-task__body"><span><strong>Укладка плитки</strong><small><MapPin size={13} /> Этаж 3 · Секция Б</small></span><ChevronRight size={20} /></span>
              <span className="worker-primary-task__progress"><span><small>Заявлено сегодня</small><b>96 из 150 м² · принято 72 м²</b></span><strong>64%</strong><i><span style={{ width: '64%' }} /></i></span>
            </button>
          </div>
          <div className="worker-task-group worker-task-group--secondary">
            <div className="worker-task-group__head"><span><ListTodo size={15} />Дополнительные задачи</span><em>3 поручения</em></div>
            <div className="worker-task-list" aria-label="Дополнительные задачи на сегодня">
              {workerQuickTasks.map(({ id, example, title, detail, status, tone, icon: Icon }) => (
                <button className={`worker-task-row is-${tone}`} type="button" onClick={() => onTask(example)} aria-label={`Открыть дополнительную задачу: ${title}`} key={id}>
                  <span className="worker-task-row__icon"><Icon size={19} /></span>
                  <div><b>{title}</b><small>{detail}</small></div>
                  <em>{status}</em>
                </button>
              ))}
            </div>
          </div>
        </section>

        {!isIdle && !isFinished ? <section className={`lunch-rule-card lunch-rule-card--${breakMode} app-enter app-enter--5`}>
          <span className="lunch-rule-card__icon"><Coffee size={21} /></span>
          <div><small>{breakMode === 'fixed' ? 'Правило объекта' : 'Свободный обед'}</small><strong>{breakMode === 'fixed' ? '12:00–12:45' : isBreak ? 'Обед идёт с 12:15' : breakCompleted ? '12:15–13:00 · учтено' : 'Отметьте перерыв вручную'}</strong><p>{breakMode === 'fixed' ? '45 минут вычтутся автоматически — дополнительных отметок не нужно.' : isBreak ? 'Смена остаётся открытой. После обеда продолжите работу одной кнопкой.' : breakCompleted ? 'Перерыв завершён. Рабочее время продолжает считаться.' : 'Таймеров задач нет: отметка влияет только на рабочее время.'}</p></div>
          {breakMode === 'manual' && isActive && !breakCompleted ? <SwipeAction label="Свайп, чтобы начать обед" onComplete={onStartBreak} tone="warm" /> : null}
        </section> : null}

        <section className="content-section app-enter app-enter--6">
          <h2>Быстрые действия</h2>
          <div className="quick-grid">
            <button type="button" onClick={() => onNavigate('task')}><span><ClipboardList size={22} /></span><b>Задачи</b></button>
            <button type="button" onClick={onProblem}><span><MessageCircle size={22} /></span><b>Сообщить</b></button>
            <button type="button" onClick={() => onNavigate('day')}><span><CalendarDays size={22} /></span><b>Мой день</b></button>
          </div>
        </section>
      </div>
      <BottomNav role="worker" active="home" onNavigate={onNavigate} />
    </div>
  )
}

function ShiftSummarySheet({ breakMode, online, onClose, onFinish }) {
  const [confirmMissing, setConfirmMissing] = useState(false)

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet shift-summary-sheet" role="dialog" aria-modal="true" aria-labelledby="shift-summary-title">
        <div className="sheet-grabber" />
        <header><div><span>Итог рабочего дня</span><h2 id="shift-summary-title">Проверьте смену</h2></div><IconButton label="Закрыть итог смены" onClick={onClose}><X size={21} /></IconButton></header>
        <div className="sheet-content">
          <div className="shift-total-card">
            <div><span>07:54</span><i /><span>18:00</span></div>
            <strong>9 ч 21 мин</strong>
            <small>рабочее время</small>
            <p><Coffee size={15} /> Обед 45 минут · {breakMode === 'fixed' ? 'по правилу объекта' : '12:15–13:00 вручную'}</p>
          </div>

          <div className="shift-summary-meta"><span><CalendarDays size={16} /><b>23 мая, четверг</b></span><span><MapPin size={16} /><b>ЖК «Северный» · Корпус 4</b></span></div>

          <div className="shift-result-list" aria-label="Результаты задач за день">
            <article className="is-ready"><span><Check size={15} /></span><div><b>Убрать мусор в секции Б</b><small>Выполнено в 10:34</small></div><em>Готово</em></article>
            <article className="is-review"><span><Ruler size={15} /></span><div><b>Укладка плитки</b><small>96 из 150 м² · обновлено в 17:30</small></div><em>На проверке</em></article>
            <article className="is-ready"><span><Check size={15} /></span><div><b>Принять материал</b><small>Выполнено · данные уже сохранены</small></div><em>Готово</em></article>
            <article className="is-missing"><span><AlertTriangle size={15} /></span><div><b>Итоговая фотография</b><small>Результат не указан</small></div><em>Уточнить</em></article>
          </div>

          <div className={`shift-missing-note ${confirmMissing ? 'is-confirming' : ''}`}><AlertTriangle size={19} /><div><b>{confirmMissing ? 'Завершить смену всё равно?' : 'Одна задача требует уточнения'}</b><p>{confirmMissing ? 'Отработанное время сохранится, а итоговая фотография попадёт руководителю в очередь «Требует уточнения».' : 'Смена не потеряется и может быть завершена. Недостающий результат останется отдельным исключением.'}</p></div></div>

          <div className={`shift-sync-state ${online ? '' : 'is-offline'}`}>{online ? <CheckCircle2 size={17} /> : <CloudOff size={17} />}<span><b>{online ? 'Все отметки отправлены' : 'Сохранится на телефоне'}</b><small>{online ? 'Итог будет доступен руководителю сразу' : 'Отправим при восстановлении сети'}</small></span></div>
        </div>
        {confirmMissing ? <div className="shift-confirm-actions"><button type="button" onClick={() => setConfirmMissing(false)}>Вернуться к проверке</button><button className="primary-gradient-button" type="button" onClick={onFinish}>Завершить всё равно</button></div> : <button className="primary-gradient-button sheet-submit" type="button" onClick={() => setConfirmMissing(true)}>Завершить смену</button>}
      </section>
    </div>
  )
}

function WorkerTasks({ online, queued, onTask, onNotifications, onNavigate }) {
  return (
    <div className="app-viewport">
      <StatusBar />
      <div className="screen-scroll worker-tasks-screen">
        <header className="page-header">
          <div><span>Сегодня · 4 задачи</span><h1>Мои задачи</h1></div>
          <IconButton label="Уведомления" onClick={onNotifications} badge={2}><Bell size={21} /></IconButton>
        </header>
        {!online ? <SyncPill online={false} queued={queued} /> : null}

        <section className="worker-tasks-summary app-enter app-enter--1">
          <div><span>Рабочий план</span><strong>1 <small>основная</small></strong></div>
          <div><span>Поручения</span><strong>3 <small>задачи</small></strong></div>
          <p><CheckCircle2 size={16} /> 1 из 4 задач выполнена</p>
        </section>

        <section className="content-section worker-today app-enter app-enter--2">
          <div className="worker-task-group worker-task-group--primary">
            <div className="worker-task-group__head"><span><i />Основная работа</span><em>Нужна доработка</em></div>
            <button className="worker-primary-task" type="button" onClick={() => onTask('volume')} aria-label="Открыть задачу: Укладка плитки">
              <span className="worker-primary-task__head"><span>Объёмная задача</span><em>Нужна доработка</em></span>
              <span className="worker-primary-task__body"><span><strong>Укладка плитки</strong><small><MapPin size={13} /> Этаж 3 · Секция Б</small></span><ChevronRight size={20} /></span>
              <span className="worker-primary-task__progress"><span><small>Заявлено сегодня</small><b>96 из 150 м² · принято 72 м²</b></span><strong>64%</strong><i><span style={{ width: '64%' }} /></i></span>
            </button>
          </div>
          <div className="worker-task-group worker-task-group--secondary">
            <div className="worker-task-group__head"><span><ListTodo size={15} />Дополнительные задачи</span><em>1 готово · 2 осталось</em></div>
            <div className="worker-task-list" aria-label="Дополнительные задачи">
              {workerQuickTasks.map(({ id, example, title, detail, status, tone, icon: Icon }) => (
                <button className={`worker-task-row is-${tone}`} type="button" onClick={() => onTask(example)} aria-label={`Открыть задачу: ${title}`} key={id}>
                  <span className="worker-task-row__icon"><Icon size={19} /></span>
                  <div><b>{title}</b><small>{detail}</small></div>
                  <em>{status}</em>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
      <BottomNav role="worker" active="task" onNavigate={onNavigate} />
    </div>
  )
}

function WorkerDay({ shiftPhase, breakMode, breakCompleted, online, queued, onBack, onTask, onNotifications, onNavigate }) {
  const idle = shiftPhase === 'idle'
  const onBreak = shiftPhase === 'break'
  const finished = shiftPhase === 'finished'
  const active = shiftPhase === 'active'
  const dayTitle = idle ? 'Смена не начата' : finished ? 'Смена завершена' : onBreak ? 'Сейчас обед' : 'Смена идёт'
  const dayDetail = idle ? 'Отметьте начало смены на главной' : finished ? (online ? 'Отправлено руководителю' : 'Сохранено на телефоне') : onBreak ? 'Рабочее время приостановлено' : 'Начата в 07:54'
  const eventCount = idle ? 0 : 2
    + (breakCompleted || onBreak || finished ? 1 : 0)
    + (breakCompleted || finished ? 1 : 0)
    + ((active && breakCompleted) || finished ? 1 : 0)
    + (finished ? 1 : 0)
  return (
    <div className="app-viewport">
      <StatusBar />
      <div className="screen-scroll worker-day-screen">
        <header className="task-header"><IconButton label="Назад на главную" onClick={onBack}><ArrowLeft size={22} /></IconButton><h1>Мой день</h1><IconButton label="Уведомления" onClick={onNotifications}><Bell size={20} /></IconButton></header>
        <section className={`day-status-hero ${finished ? 'is-finished' : ''} ${idle ? 'is-idle' : ''} ${onBreak ? 'is-break' : ''}`}>
          <span>{finished ? <CheckCircle2 size={22} /> : idle ? <CalendarDays size={22} /> : onBreak ? <Coffee size={22} /> : <Clock3 size={22} />}</span>
          <div><small>23 мая · ЖК «Северный»</small><h2>{dayTitle}</h2><p>{dayDetail}</p></div>
          <strong>{finished ? '9:21' : idle ? '—' : onBreak ? 'обед' : 'идёт'}</strong>
        </section>
        {!online ? <SyncPill online={false} queued={queued} /> : null}
        <section className="day-facts"><article><span>Начало</span><b>{idle ? '—' : '07:54'}</b></article><article><span>Обед</span><b>{idle ? '—' : '45 мин'}</b><small>{idle ? 'ещё не учтён' : breakMode === 'fixed' ? 'по правилу' : breakCompleted || onBreak ? 'вручную' : 'не начат'}</small></article><article><span>Окончание</span><b>{finished ? '18:00' : '—'}</b></article></section>
        <section className="content-section"><div className="section-title-row"><h2>События дня</h2><span className="day-event-count">{eventCount ? `${eventCount} событий` : 'Пока нет'}</span></div>
          {idle ? <div className="day-empty-state"><CalendarDays size={24} /><div><b>Событий пока нет</b><p>После начала смены здесь появятся отметки времени и результаты задач.</p></div><button type="button" onClick={onBack}>На главную</button></div> : <div className="day-event-timeline">
            <div className="is-done"><time>07:54</time><i /><p><b>Смена начата</b><small>Корпус 4 · {online ? 'отправлено' : 'на телефоне'}</small></p></div>
            <div className="is-done"><time>10:34</time><i /><p><b>Уборка выполнена</b><small>Простая задача закрыта</small></p></div>
            {(breakCompleted || onBreak || finished) ? <div className="is-done"><time>{breakMode === 'fixed' ? '12:00' : '12:15'}</time><i /><p><b>Обед</b><small>{breakMode === 'fixed' ? 'Учтён по правилу объекта' : 'Начат вручную'}</small></p></div> : null}
            {(breakCompleted || finished) ? <div className="is-done"><time>{breakMode === 'fixed' ? '12:45' : '13:00'}</time><i /><p><b>Продолжена работа</b><small>{breakMode === 'fixed' ? 'Автоматический интервал завершён' : 'Обед завершён вручную'}</small></p></div> : null}
            {(active && breakCompleted) || finished ? <button type="button" onClick={() => onTask('volume')}><time>17:30</time><i /><p><b>Добавлен результат</b><small>Укладка плитки · 96 м²</small></p><ChevronRight size={17} /></button> : null}
            {finished ? <div className="is-done"><time>18:00</time><i /><p><b>Смена завершена</b><small>Итог дня сохранён</small></p></div> : null}
          </div>}
        </section>
        {finished ? <section className="day-exception"><AlertTriangle size={20} /><div><b>Требует уточнения</b><p>Итоговая фотография не добавлена. Время смены уже сохранено.</p></div><button type="button" onClick={() => onTask('photo')}>Открыть</button></section> : null}
      </div>
      <BottomNav role="worker" active="home" onNavigate={onNavigate} />
    </div>
  )
}

function ResponsibilitySheet({ online, perspective, members, currentId, selectedId, reason, onSelect, onReasonChange, onClose, onConfirm }) {
  const current = members.find((member) => member.id === currentId)
  const selected = members.find((member) => member.id === selectedId)
  const actionLabel = current ? 'Передать ответственность' : 'Назначить ответственного'

  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet bottom-sheet--responsibility" role="dialog" aria-modal="true" aria-labelledby="responsibility-sheet-title">
        <div className="sheet-grabber" />
        <header><div><span>{perspective === 'foreman' ? 'Управление бригадира' : 'Управление подрядчика'}</span><h2 id="responsibility-sheet-title">{actionLabel}</h2></div><IconButton label="Закрыть" onClick={onClose}><X size={21} /></IconButton></header>
        <div className="sheet-content">
          <div className="responsibility-sheet__current"><UserCheck size={20} /><div><small>Сейчас отвечает</small><b>{current?.name || 'Никто не назначен'}</b><p>{current ? 'Передача не изменит уже внесённые результаты.' : 'Без ответственного общий итог остаётся риском.'}</p></div></div>
          <div className="sheet-field-heading"><b>{current ? 'Кому передать' : 'Кого назначить'}</b><small>Можно выбрать только участника этой задачи</small></div>
          <div className="responsibility-member-list" role="radiogroup" aria-label="Выбрать ответственного">
            {members.filter((member) => member.id !== currentId).map((member) => <button type="button" role="radio" aria-checked={selectedId === member.id} className={selectedId === member.id ? 'is-selected' : ''} onClick={() => onSelect(member.id)} key={member.id}><span>{member.initials}</span><div><b>{member.name}</b><small>{member.trade} · на смене</small></div>{selectedId === member.id ? <CheckCircle2 size={18} /> : null}</button>)}
          </div>
          <label className="field"><span>Причина <em>обязательно</em></span><textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Например: передаём участок после обеда" required /></label>
          <div className="responsibility-preserve-note"><ShieldCheck size={18} /><p><b>Данные сохранятся</b><span>96 м² прогресса, фотографии и автор каждой записи останутся в истории.</span></p></div>
          {!online ? <div className="responsibility-offline-note"><CloudOff size={18} /><p><b>Нужно подключение к сети</b><span>Назначение ответственного проверяется сервером и не ставится в офлайн-очередь.</span></p></div> : null}
        </div>
        <button className="primary-gradient-button sheet-submit" type="button" disabled={!online || !selected || !reason.trim()} onClick={onConfirm}>{actionLabel}</button>
      </section>
    </div>
  )
}

function WorkerTask({ online, queued, initialExample = 'volume', initialPerspective = 'worker', onBack, onProblem, onIssue, onSubmit, onNotify }) {
  const example = initialExample
  const perspective = initialPerspective
  const [reviewState, setReviewState] = useState('partial')
  const [responsibilityMode, setResponsibilityMode] = useState('assigned')
  const [responsibleId, setResponsibleId] = useState('ivanov')
  const [responsibilitySheetOpen, setResponsibilitySheetOpen] = useState(false)
  const [selectedResponsibleId, setSelectedResponsibleId] = useState('smirnov')
  const [transferReason, setTransferReason] = useState('Перераспределение работ на участке')
  const [responsibilityEvents, setResponsibilityEvents] = useState([
    { id: 'r-assigned', time: '07:48', title: 'Ответственный назначен', detail: 'Иванов И.И. · назначил Петров А.С.' },
  ])

  const teamMembers = [
    { id: 'ivanov', initials: 'ИИ', name: 'Иванов И.И.', shortName: 'Иванов', trade: 'Плиточник' },
    { id: 'fedorov', initials: 'АФ', name: 'Фёдоров А.В.', shortName: 'Фёдоров', trade: 'Плиточник' },
    { id: 'smirnov', initials: 'МС', name: 'Смирнов М.С.', shortName: 'Смирнов', trade: 'Плиточник' },
    { id: 'orlov', initials: 'АО', name: 'Орлов А.О.', shortName: 'Орлов', trade: 'Подсобный рабочий' },
    { id: 'kuznetsov', initials: 'ДА', name: 'Кузнецов Д.А.', shortName: 'Кузнецов', trade: 'Разнорабочий' },
  ]
  const responsible = teamMembers.find((member) => member.id === responsibleId)
  const currentWorkerId = 'ivanov'
  const isResponsibilityMissing = responsibilityMode === 'unassigned' || responsibilityMode === 'removed'
  const canSubmitTeamResult = responsibilityMode === 'assigned' && responsibleId === currentWorkerId

  const examples = {
    simple: {
      title: 'Убрать мусор в секции Б',
      eyebrow: 'Дополнительное поручение',
      location: 'Этаж 3 · Секция Б',
      resultLabel: 'Простое выполнение',
      status: 'Выполнено',
      statusTone: 'done',
      icon: Check,
      reviewRequired: false,
      completed: true,
    },
    delivery: {
      title: 'Принять материал',
      eyebrow: 'Дополнительное поручение',
      location: 'Зона разгрузки · Корпус 4',
      resultLabel: 'Простое выполнение',
      status: 'До 13:00',
      statusTone: 'active',
      icon: Package,
      reviewRequired: false,
      completed: false,
    },
    photo: {
      title: 'Сделать итоговую фотографию',
      eyebrow: 'Дополнительное поручение',
      location: 'Этаж 3 · Секция Б',
      resultLabel: 'Простое выполнение',
      status: 'Не начато',
      statusTone: 'active',
      icon: Camera,
      reviewRequired: false,
      completed: false,
    },
    volume: {
      title: 'Укладка плитки',
      eyebrow: 'Основная работа',
      location: 'Этаж 3 · Секция Б',
      resultLabel: 'Измеримый результат',
      status: reviewState === 'accepted' ? 'Принято' : reviewState === 'rework' ? 'Возвращено' : 'Частично принято',
      statusTone: reviewState === 'accepted' ? 'done' : reviewState === 'rework' ? 'danger' : 'review',
      icon: Ruler,
      reviewRequired: true,
    },
    stages: {
      title: 'Установить 8 светильников',
      eyebrow: 'Работа с этапами',
      location: 'Этаж 2 · Коридор А',
      resultLabel: 'Количество и этапы',
      status: 'В работе',
      statusTone: 'active',
      icon: Layers3,
      reviewRequired: true,
    },
  }
  const task = examples[example]
  const isSimple = ['simple', 'delivery', 'photo'].includes(example)
  const TaskIcon = task.icon
  const confirmedToday = reviewState === 'accepted' ? 96 : 72

  const applyReview = (nextState) => {
    if (!online) return onNotify('Проверка результата доступна после подключения к сети')
    setReviewState(nextState)
    onNotify(nextState === 'accepted' ? 'Результат принят полностью' : nextState === 'partial' ? 'Подтверждено 72 из 96 м²' : 'Результат возвращён на доработку')
  }

  const takeResponsibility = () => {
    if (!online) return onNotify('Чтобы взять ответственность, подключитесь к сети')
    setResponsibilityMode('assigned')
    setResponsibleId(currentWorkerId)
    setResponsibilityEvents((events) => [{ id: `r-take-${Date.now()}`, time: '17:42', title: 'Ответственность взята', detail: 'Иванов И.И. · подтверждено сервером' }, ...events])
    onNotify('Теперь вы отвечаете за общий результат команды')
  }

  const openResponsibilitySheet = () => {
    const nextMember = teamMembers.find((member) => member.id !== responsibleId)
    setSelectedResponsibleId(nextMember?.id || 'ivanov')
    setTransferReason(responsible ? 'Перераспределение работ на участке' : 'Назначение ответственного за общий итог')
    setResponsibilitySheetOpen(true)
  }

  const confirmResponsibilityChange = () => {
    if (!online) return onNotify('Назначение ответственного доступно после подключения к сети')
    const nextResponsible = teamMembers.find((member) => member.id === selectedResponsibleId)
    if (!nextResponsible || !transferReason.trim()) return
    const previousName = responsible?.name || 'Не назначен'
    setResponsibleId(nextResponsible.id)
    setResponsibilityMode('assigned')
    setResponsibilityEvents((events) => [{ id: `r-transfer-${Date.now()}`, time: '17:46', title: responsible ? 'Ответственность передана' : 'Ответственный назначен', detail: `${previousName} → ${nextResponsible.name} · ${transferReason.trim()}` }, ...events])
    setResponsibilitySheetOpen(false)
    onNotify(`Теперь за общий итог отвечает ${nextResponsible.name}`)
  }

  const progressRows = example === 'volume'
    ? [
        { id: 'p-1120', time: '11:20', value: '+35 м²', title: 'Первая добавка', author: 'Иванов И.И.', sync: 'sent' },
        { id: 'p-1410', time: '14:10', value: '+40 м²', title: 'Промежуточный прогресс', author: 'Смирнов М.С.', sync: 'sent' },
        { id: 'p-1730', time: '17:30', value: '+21 м²', title: 'Последняя добавка', author: 'Иванов И.И.', sync: 'sent' },
      ]
    : example === 'stages'
      ? [
          { id: 's-1025', time: '10:25', value: '8 точек', title: 'Проводка завершена', author: 'Иванов И.И.', sync: 'sent' },
          { id: 's-1540', time: '15:40', value: '3 шт.', title: 'Светильники установлены', author: 'Иванов И.И.', sync: 'sent' },
        ]
      : task.completed
        ? [{ id: 'c-1034', time: '10:34', value: 'Готово', title: 'Поручение выполнено', author: 'Иванов И.И.', sync: 'sent' }]
        : []

  return (
    <div className="app-viewport">
      <StatusBar />
      <div className="screen-scroll task-screen task-passport-screen">
        <header className="task-header task-header--worker">
          <IconButton label="Назад" onClick={onBack}><ArrowLeft size={22} /></IconButton>
          <div><span>Задача #СМ-248</span><h1>Паспорт задачи</h1></div>
          <IconButton label="Другие действия" onClick={() => onNotify('Дополнительные действия по задаче')}><MoreHorizontal size={22} /></IconButton>
        </header>

        {!online ? <div className="passport-offline-note"><CloudOff size={17} /><span><b>Работа без сети</b><small>Фото, комментарии и прогресс сохранятся на телефоне. Ответственность и проверка требуют подключения.</small></span></div> : null}

        <section className={`passport-hero passport-hero--${task.statusTone} app-enter app-enter--2`}>
          <header><span className="passport-hero__icon"><TaskIcon size={23} /></span><div><small>{task.eyebrow}</small><h2>{task.title}</h2><p><MapPin size={13} /> {task.location}</p></div><em>{task.status}</em></header>
          <div className="passport-hero__meta"><span>{example === 'volume' ? <Users size={15} /> : <UserRound size={15} />}<b>{example === 'volume' ? 'Бригада №2 · 5 человек' : 'Иванов И.И.'}</b><small>{example === 'volume' ? (responsible ? `Ответственный: ${responsible.name}` : 'Ответственный не выбран') : 'Исполнитель и ответственный'}</small></span><span><CalendarDays size={15} /><b>Сегодня, 23 мая</b><small>Обычный приоритет</small></span></div>

          {example === 'volume' ? <div className="passport-volume-ledger">
            <section><header><span>Вся задача</span><small>многодневный итог</small></header><div><span><small>Общий объём</small><b>500 м²</b></span><span><small>Подтверждено всего</small><b>358 м²</b></span><span><small>Осталось</small><b>142 м²</b></span></div></section>
            <section className="is-today"><header><span>Сегодня</span><small>план и результат дня</small></header><div><span><small>План</small><b>150 м²</b></span><span><small>Заявлено</small><b>96 м²</b></span><span><small>Подтверждено</small><b>{confirmedToday} м²</b></span></div><i><span style={{ width: '64%' }} /></i><footer><span>Заявлено 64% плана</span><b>Осталось по плану 54 м²</b></footer></section>
          </div> : null}

          {isSimple ? <div className={`passport-simple-result ${task.completed ? '' : 'is-pending'}`}><span>{task.completed ? <CheckCircle2 size={22} /> : <Clock3 size={22} />}</span><div><small>Результат задачи</small><b>{task.completed ? 'Выполнено в 10:34' : 'Ожидает выполнения'}</b><p>{task.completed ? 'Проверка не требовалась — задача закрыта сразу.' : 'После выполнения отметьте задачу готовой. Результат сохранится даже без сети.'}</p></div></div> : null}

          {example === 'stages' ? <div className="passport-stage-summary"><span><small>Главный результат</small><strong>3 <em>из 8 шт.</em></strong><p>Полностью установленные светильники</p></span><div><small>Этапы</small><b>2 из 4 завершены</b><p>Не считается процентом физического объёма</p></div></div> : null}
        </section>

        {example === 'volume' ? <section className="content-section passport-section passport-responsibility app-enter app-enter--3">
          <div className="section-title-row"><h2>Команда и итог</h2><em className={`passport-section__count responsibility-status responsibility-status--${responsibilityMode}`}>{responsible ? '1 ответственный' : 'Есть риск'}</em></div>
          <div className={`responsibility-card responsibility-card--${responsibilityMode}`}>
            <header><div className="responsibility-team-avatars" aria-label="Участники задачи">{teamMembers.slice(0, 4).map((member) => <span className={member.id === responsibleId ? 'is-responsible' : ''} title={member.name} key={member.id}>{member.initials}</span>)}{teamMembers.length > 4 ? <em>+{teamMembers.length - 4}</em> : null}</div><span><b>Бригада №2</b><small>5 участников · общий объём не делится</small></span></header>

            {responsible ? <div className="responsibility-owner"><span>{responsible.initials}</span><div><small>{responsibilityMode === 'conflict' ? 'Сервер подтвердил первым' : 'Отвечает за общий итог'}</small><b>{responsible.name}</b><p>{responsibilityMode === 'conflict' ? 'Запрос Иванова не применён — двойного ответственного нет.' : 'Только он отправляет общий числовой результат команды.'}</p></div><UserCheck size={21} /></div> : <div className="responsibility-owner is-missing"><span><AlertTriangle size={20} /></span><div><small>{responsibilityMode === 'removed' ? 'Доступ прекращён' : 'Никто не назначен'}</small><b>{responsibilityMode === 'removed' ? 'Ответственный снят с объекта' : 'Общий итог без ответственного'}</b><p>{responsibilityMode === 'removed' ? 'Ранее внесённые данные сохранены. Нужен новый ответственный.' : 'Первый подтверждённый запрос назначит одного участника.'}</p></div></div>}

            <div className="responsibility-permissions"><span><ImagePlus size={16} /><b>Фото</b></span><span><MessageCircle size={16} /><b>Комментарии</b></span><span><AlertTriangle size={16} /><b>Проблемы</b></span><small>Доступно всем участникам</small></div>

            <div className="responsibility-actions">
              {perspective === 'worker' && isResponsibilityMissing ? <button className="responsibility-primary-action" type="button" disabled={!online} onClick={takeResponsibility}><UserCheck size={17} />{online ? 'Взять ответственность' : 'Нужно подключение'}</button> : null}
              {perspective === 'worker' && responsibleId !== currentWorkerId && !isResponsibilityMissing ? <div className="responsibility-readonly"><ShieldCheck size={17} /><span><b>Вы участвуете в задаче</b><small>Общий итог отправит {responsible?.name}.</small></span></div> : null}
              {perspective !== 'worker' ? <div className="responsibility-manager-actions"><button className="responsibility-primary-action" type="button" onClick={openResponsibilitySheet}><UserPlus size={17} />{responsible ? 'Передать ответственность' : 'Назначить ответственного'}</button><button className="responsibility-secondary-action" type="button" onClick={() => onSubmit('volume')}><Plus size={17} />Внести общий итог</button></div> : null}
              {perspective === 'worker' && canSubmitTeamResult ? <div className="responsibility-readonly is-success"><CheckCircle2 size={17} /><span><b>Общий итог закреплён за вами</b><small>Остальные участники не смогут отправить второй итог.</small></span></div> : null}
            </div>

            <div className="responsibility-history"><div><b>История ответственности</b><small>Прогресс и его авторы не меняются</small></div>{responsibilityEvents.map((event) => <article key={event.id}><time>{event.time}</time><i /><p><b>{event.title}</b><small>{event.detail}</small></p></article>)}</div>
          </div>
        </section> : null}

        {example === 'stages' ? <section className="content-section passport-section app-enter app-enter--3">
          <div className="section-title-row"><h2>Этапы</h2><em className="passport-section__count">2 из 4</em></div>
          <div className="passport-stage-list">
            <article className="is-done"><span>01</span><div><b>Провести проводку</b><small>8 из 8 точек · Иванов И.И.</small></div><CheckCircle2 size={18} /></article>
            <article className="is-done"><span>02</span><div><b>Подготовить крепления</b><small>8 из 8 шт. · Иванов И.И.</small></div><CheckCircle2 size={18} /></article>
            <article className="is-active"><span>03</span><div><b>Установить светильники</b><small>3 из 8 шт. · выполняется</small></div><Clock3 size={18} /></article>
            <article><span>04</span><div><b>Проверить и убрать</b><small>После установки</small></div><span className="passport-stage-list__waiting">Ожидает</span></article>
          </div>
        </section> : null}

        <section className="content-section passport-section task-progress-log app-enter app-enter--3">
          <div className="section-title-row"><h2>{isSimple ? 'События задачи' : 'Прогресс сегодня'}</h2>{perspective === 'worker' && !isSimple && (example !== 'volume' || canSubmitTeamResult) ? <button className="text-link" type="button" onClick={() => onSubmit(example)}>Добавить <Plus size={14} /></button> : null}</div>
          {progressRows.length ? <div className="passport-progress-list">
            {progressRows.map((row) => <article className={row.sync === 'local' ? 'is-local' : ''} key={row.id}><time>{row.time}</time><span>{row.value}</span><p><b>{row.title}</b><small>{row.author} · {row.sync === 'local' ? 'сохранено на телефоне' : 'отправлено'}</small></p>{row.sync === 'local' ? <CloudOff size={17} /> : <CheckCircle2 size={17} />}</article>)}
          </div> : <div className="passport-progress-empty"><Clock3 size={20} /><span><b>Событий пока нет</b><small>Первая отметка появится после выполнения задачи.</small></span></div>}
        </section>

        <section className="content-section passport-section app-enter app-enter--4">
          <div className="section-title-row"><h2>Вложения</h2></div>
          <div className="passport-attachments-card">
            <button className="passport-attachments-card__primary" type="button" onClick={() => onNotify(task.completed || !isSimple ? 'Открываем фото результата' : 'Фото можно добавить при выполнении')}><span><ImagePlus size={20} /></span><div><b>Фото результата</b><small>{isSimple ? task.completed ? '1 фото к выполнению' : 'Пока не добавлено' : '5 фото к последней сдаче'}</small></div><ChevronRight size={17} /></button>
            <div className="passport-attachments-card__links">
              <button type="button" onClick={() => onNotify('Открываем обсуждение задачи')}><MessageCircle size={18} /><span>Обсуждение</span><em>3</em></button>
              <button type="button" onClick={example === 'volume' && onIssue ? onIssue : onProblem}><AlertTriangle size={18} /><span>Проблемы</span><em>{example === 'volume' ? '1' : '0'}</em></button>
            </div>
          </div>
        </section>

        <section className="content-section passport-section passport-versions app-enter app-enter--5">
          <div className="section-title-row"><h2>{isSimple ? 'История выполнения' : example === 'stages' ? 'Последние изменения' : 'История сдачи'}</h2><em className="passport-section__count">{isSimple && !task.completed ? 'Нет записей' : example === 'volume' && reviewState !== 'accepted' ? '2 записи' : '1 запись'}</em></div>
          <div className="passport-version-list">
            {example === 'volume' && reviewState !== 'accepted' ? <article className="passport-version-card is-current"><header><span>Нужно исправить</span><em>Ожидает повторной сдачи</em><time>Сегодня</time></header><div><b>Участок у оси Б</b><p>Исправьте швы и добавьте новый результат. Предыдущая проверка сохранена ниже.</p></div><footer><span><Clock3 size={15} />Ожидает от Иванова И.И.</span><button type="button" onClick={() => onSubmit('volume')}>Добавить результат</button></footer></article> : null}
            {isSimple && !task.completed ? <div className="passport-history-empty"><FileText size={21} /><span><b>Задача ещё не выполнена</b><small>История сохранит время, автора, фото и комментарий после первой отметки.</small></span></div> : <article className={`passport-version-card is-${reviewState}`}><header><span>{isSimple ? 'Выполнено' : example === 'stages' ? 'Последнее обновление' : 'Сдано на проверку'}</span><em>{isSimple ? 'Задача закрыта' : example === 'stages' ? 'В работе' : reviewState === 'accepted' ? 'Принято полностью' : reviewState === 'rework' ? 'Возвращено' : 'Принято частично'}</em><time>{isSimple ? '10:34' : example === 'stages' ? '15:40' : '17:35'}</time></header><div><b>{isSimple ? 'Иванов И.И. отметил задачу готовой' : example === 'stages' ? 'Установлено 3 из 8 светильников' : 'Заявлено 96 м² · принято ' + confirmedToday + ' м²'}</b><p>{isSimple ? 'Проверка для этого поручения не требовалась.' : example === 'stages' ? 'Проводка и крепления завершены. Установка продолжается.' : reviewState === 'accepted' ? 'Результат принят полностью, остаток пересчитан.' : 'Не принято: участок у оси Б. Требуется исправить швы.'}</p></div><footer><span><UserCheck size={15} />{isSimple ? 'Сохранил Иванов И.И.' : example === 'stages' ? 'Обновил Иванов И.И.' : 'Проверил Петров А.С.'}</span><button type="button" onClick={() => onNotify('Открываем фото и комментарии сдачи')}>Фото и комментарии</button></footer></article>}
          </div>
        </section>

        {perspective !== 'worker' && task.reviewRequired ? <section className="content-section passport-review-panel app-enter app-enter--6">
          <header><div><small>{perspective === 'foreman' ? 'Проверка бригадира' : 'Решение подрядчика'}</small><h2>Проверить результат</h2><p>{online ? 'Решение сохранится в истории сдачи.' : 'Окончательная проверка недоступна без сети.'}</p></div></header>
          <div className="passport-review-card">
            <div className="passport-review-facts"><span><small>Заявлено</small><b>{example === 'volume' ? '96 м²' : '3 шт.'}</b></span><span><small>Сейчас подтверждено</small><b>{example === 'volume' ? `${confirmedToday} м²` : '—'}</b></span></div>
            <div className="passport-review-actions"><button type="button" disabled={!online} onClick={() => applyReview('accepted')}><CheckCircle2 size={17} />Принять всё</button><button type="button" disabled={!online} onClick={() => applyReview('partial')}><Ruler size={17} />Частично</button><button type="button" disabled={!online} onClick={() => applyReview('rework')}><RotateCcw size={17} />На доработку</button></div>
          </div>
        </section> : null}

        <section className="content-section instruction-card passport-instruction app-enter app-enter--6">
          <div className="section-title-row"><h2>Инструкция</h2><button className="text-link" type="button" onClick={() => onNotify('Открываем полную инструкцию')}>Показать полностью <ChevronRight size={15} /></button></div>
          <button className="document-row" type="button" onClick={() => onNotify('Технологическая карта открыта')}><span className="pdf-icon">PDF</span><span><b>Технологическая карта</b><small>1.2 МБ · доступно офлайн</small></span><ChevronRight size={18} /></button>
        </section>
      </div>

      {perspective === 'worker' ? <div className="task-action-dock passport-action-dock">
        <SyncPill online={online} queued={queued} />
        <div><button className="passport-dock-icon" type="button" onClick={() => onNotify('Открываем обсуждение задачи')} aria-label="Написать"><MessageCircle size={19} /></button><button className="outline-danger-button" type="button" onClick={onProblem}><AlertTriangle size={18} />Проблема</button>{example === 'volume' && isResponsibilityMissing ? <button className="coral-button" type="button" disabled={!online} onClick={takeResponsibility}><UserCheck size={18} />{online ? 'Взять ответственность' : 'Нужна сеть'}</button> : example === 'volume' && !canSubmitTeamResult ? <button className="passport-dock-owner" type="button" disabled><ShieldCheck size={18} />Итог у {responsible?.shortName}</button> : isSimple && task.completed ? <button className="passport-dock-owner" type="button" disabled><CheckCircle2 size={18} />Выполнено</button> : <button className="coral-button" type="button" onClick={() => onSubmit(example)}>{isSimple ? <Check size={18} /> : <Plus size={18} />}{isSimple ? 'Отметить готово' : 'Добавить результат'}</button>}</div>
      </div> : null}
      {responsibilitySheetOpen ? <ResponsibilitySheet online={online} perspective={perspective} members={teamMembers} currentId={responsibleId} selectedId={selectedResponsibleId} reason={transferReason} onSelect={setSelectedResponsibleId} onReasonChange={setTransferReason} onClose={() => setResponsibilitySheetOpen(false)} onConfirm={confirmResponsibilityChange} /> : null}
    </div>
  )
}

function ForemanTeam({ online, onCreateTask, onNotifications, onNavigate }) {
  return (
    <div className="app-viewport">
      <StatusBar />
      <div className="screen-scroll foreman-team">
        <header className="page-header">
          <div><span>Корпус №4</span><h1>Команда сегодня</h1></div>
          <IconButton label="Уведомления" onClick={onNotifications} badge={3}><Bell size={21} /></IconButton>
        </header>

        {!online ? <SyncPill online={false} queued={4} /> : null}

        <section className="team-hero app-enter app-enter--1">
          <img className="hero-art hero-art--site" src="/graphics/svg/site-silhouette.svg" alt="" />
          <div className="aurora-lines" aria-hidden="true"><i /><i /><i /></div>
          <div className="team-hero__top">
            <div><span>На объекте</span><strong>13 <small>из</small> 15</strong><p>человек</p></div>
            <span className="people-orbit"><Users size={30} /></span>
          </div>
          <div className="avatar-stack">
            {workers.map((worker) => <Avatar key={worker.name} initials={worker.initials} tone={worker.tone} small />)}
            <Avatar initials="+6" tone="pale" small />
          </div>
        </section>

        <section className="attendance-grid app-enter app-enter--2">
          <article><span>На смене</span><strong className="success-text">13</strong></article>
          <article><span>Опоздали</span><strong className="danger-text">2</strong></article>
          <article><span>Не отметились</span><strong>2</strong></article>
        </section>

        <section className="content-section app-enter app-enter--3">
          <div className="section-title-row"><h2>Состав команды</h2><button className="text-link" type="button" onClick={() => onNavigate('team-list')}>Все 15 <ChevronRight size={15} /></button></div>
          <div className="people-list">
            {workers.map((worker) => (
              <button className="person-row" key={worker.name} type="button" onClick={() => onNavigate('worker')}>
                <div className="person-row__avatar"><Avatar initials={worker.initials} tone={worker.tone} /><i className={`presence-dot presence-dot--${worker.state}`} /></div>
                <div className="person-row__main">
                  <strong>{worker.name}</strong>
                  <span>{worker.trade} · {worker.task}</span>
                  <small>{worker.state === 'offline' ? 'Не на связи с 07:58' : `Начал ${worker.time}`}</small>
                </div>
                <span className="message-action"><MessageCircle size={18} /></span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <button className="create-task-button" type="button" onClick={onCreateTask}><Plus size={21} />СОЗДАТЬ ЗАДАЧУ</button>
      <BottomNav role="foreman" active="team" onNavigate={onNavigate} />
    </div>
  )
}

function ForemanAttention({ onReview, onIssue, onContact, onNotifications, onNavigate }) {
  return (
    <div className="app-viewport">
      <StatusBar />
      <div className="screen-scroll attention-screen">
        <header className="page-header">
          <div><span>Сегодня · 3 события</span><h1>Требуют внимания</h1></div>
          <IconButton label="Уведомления" onClick={onNotifications}><Bell size={21} /></IconButton>
        </header>

        <section className="attention-card attention-card--critical app-enter app-enter--1">
          <img className="attention-contour" src="/graphics/svg/safety-contour.svg" alt="" />
          <div className="attention-card__heading">
            <span className="soft-icon soft-icon--orange"><BarChart3 size={20} /></span>
            <div><strong>Отставание от плана</strong><span>Укладка плитки · Этаж 3 · Секция Б</span></div>
          </div>
          <div className="metrics-row">
            <div><span>План</span><strong>150 м²</strong></div>
            <div><span>Заявлено</span><strong>96 м²</strong></div>
            <div><span>Подтверждено</span><strong>72 м²</strong></div>
          </div>
          <div className="assignee-row"><div className="avatar-stack avatar-stack--light"><Avatar initials="ИИ" tone="blue" small /><Avatar initials="АФ" tone="green" small /><Avatar initials="+3" tone="pale" small /></div><span>Иванов, Фёдоров и ещё 3 исполнителя</span></div>
          <span className="critical-label"><AlertTriangle size={14} /> До плана 54 м² · к проверке 24 м²</span>
        </section>

        <section className="attention-card app-enter app-enter--2">
          <div className="attention-card__heading">
            <span className="soft-icon soft-icon--orange"><Package size={20} /></span>
            <div><strong>Нет материала</strong><span>Кладка стен · Этаж 4 · Секция А</span></div>
          </div>
          <div className="material-row"><Package size={20} /><div><strong>Камень керамический 2.1НФ</strong><span>Остаток: 120 шт. · хватит на 1 день</span></div><AlertTriangle size={20} /></div>
          <button className="attention-open-issue" type="button" onClick={onIssue} aria-label="Подробнее о проблеме с материалом">Подробнее <ChevronRight size={17} /></button>
        </section>

        <section className="attention-card result-card app-enter app-enter--3">
          <div className="attention-card__heading">
            <span className="soft-icon soft-icon--blue"><FileText size={20} /></span>
            <div><strong>Результат на проверке</strong><span>Укладка плитки · Этаж 3 · Секция Б</span></div>
          </div>
          <div className="review-row"><Clock3 size={18} /><div><span>Отправлен: Сегодня, 09:15</span><strong>Ожидает проверки бригадира</strong></div><div className="avatar-stack avatar-stack--light"><Avatar initials="ИИ" tone="blue" small /><Avatar initials="АФ" tone="green" small /><Avatar initials="+3" tone="pale" small /></div></div>
        </section>

        <section className="content-section activity-section app-enter app-enter--4">
          <div className="section-title-row"><h2>Активность</h2><button className="text-link" type="button" onClick={() => onNavigate('messages')}>Смотреть всё <ChevronRight size={15} /></button></div>
          <div className="activity-row"><time>09:30</time><span className="activity-row__line" /><Avatar initials="ИИ" tone="blue" small /><div><strong>Иванов И.И.</strong><span>Отправил результат по задаче<br />«Укладка плитки»</span></div><FileText size={18} /></div>
        </section>
      </div>

      <div className="attention-actions">
        <button className="outline-coral-button" type="button" onClick={onContact}><Phone size={18} />Связаться</button>
        <button className="coral-button" type="button" onClick={onReview}><FileText size={18} />Открыть проверку</button>
      </div>
      <BottomNav role="foreman" active="today" onNavigate={onNavigate} />
    </div>
  )
}

function ContractorSidebar({ mobile, onNavigate }) {
  const items = [
    { label: 'Обзор', icon: LayoutDashboard, active: true },
    { label: 'Объекты', icon: Building2, badge: 3 },
    { label: 'Команда', icon: Users },
    { label: 'Задачи', icon: ClipboardList, badge: 5 },
    { label: 'Табель', icon: CalendarDays },
    { label: 'Отчёты', icon: BarChart3 },
  ]

  if (mobile) return null

  return (
    <aside className="contractor-sidebar">
      <Brand />
      <div className="contractor-sidebar__object"><span>Организация</span><button type="button" onClick={() => onNavigate('Смена Строй')}><span className="object-mini-logo">СС</span><span><b>Смена Строй</b><small>3 активных объекта</small></span><ChevronDown size={16} /></button></div>
      <nav aria-label="Кабинет подрядчика">
        {items.map(({ label, icon: Icon, active, badge }) => (
          <button type="button" className={active ? 'is-active' : ''} onClick={() => onNavigate(label)} key={label}>
            <Icon size={19} strokeWidth={2.1} /><span>{label}</span>{badge ? <small>{badge}</small> : null}
          </button>
        ))}
      </nav>
      <div className="contractor-sidebar__footer">
        <button type="button" onClick={() => onNavigate('Настройки')}><Settings size={19} />Настройки</button>
        <div className="contractor-profile"><Avatar initials="АР" tone="blue" /><span><b>Александр Романов</b><small>Подрядчик</small></span><MoreHorizontal size={18} /></div>
      </div>
    </aside>
  )
}

function ContractorTopbar({ mobile, onCreateTask, onNotifications, onNavigate }) {
  return (
    <header className="contractor-topbar">
      {mobile ? <button className="contractor-menu" type="button" aria-label="Открыть меню" onClick={() => onNavigate('Меню')}><Menu size={21} /></button> : null}
      {mobile ? <Brand compact /> : <label className="contractor-search"><Search size={18} /><input aria-label="Поиск" placeholder="Найти сотрудника, задачу или объект" /></label>}
      <div className="contractor-topbar__actions">
        {!mobile ? <button className="contractor-date" type="button" onClick={() => onNavigate('Дата')}><CalendarDays size={17} />Сегодня, 23 мая<ChevronDown size={15} /></button> : null}
        <IconButton label="Уведомления" onClick={onNotifications} badge={5}><Bell size={20} /></IconButton>
        <button className="contractor-create" type="button" aria-label="Создать задачу" onClick={onCreateTask}><Plus size={19} />{mobile ? '' : 'Новая задача'}</button>
      </div>
    </header>
  )
}

function ContractorObjectCard({ object, mobile, onOpen }) {
  return (
    <article className={`contractor-object contractor-object--${object.tone}`}>
      <img className="contractor-object__background" src={object.background} alt="" />
      <div className="contractor-object__top"><span>Активный объект</span><button type="button" aria-label={`Открыть меню ${object.name}`}><MoreHorizontal size={18} /></button></div>
      <div className="contractor-object__title"><span className="object-avatar"><Building2 size={19} /></span><div><h3>{object.name}</h3><p>{object.code}</p></div></div>
      <div className="contractor-object__stats">
        <span><small>На объекте</small><b>{object.present}<em>/{object.people}</em></b></span>
        <span><small>План дня</small><b>{object.progress}%</b></span>
        <span className={object.tone === 'orange' || object.tone === 'blue' ? 'has-issue' : ''}><small>Контроль</small><b>{object.issue}</b></span>
      </div>
      <button className="contractor-object__open" type="button" onClick={() => onOpen(object.name)}>Открыть объект<ArrowUpRight size={16} /></button>
      {!mobile ? <span className="contractor-object__progress"><i style={{ width: `${object.progress}%` }} /></span> : null}
    </article>
  )
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return matches
}

function ContractorDashboard({ mode, onCreateTask, onNotifications, onOpenIssue, onNotify }) {
  const narrowViewport = useMediaQuery('(max-width: 767px)')
  const mobile = mode === 'mobile' || narrowViewport
  const navigate = (target) => onNotify(`${target}: раздел будет следующим экраном UX-карты`)

  return (
    <section className={`contractor-shell contractor-shell--${mobile ? 'mobile' : 'desktop'}`} aria-label={`Кабинет подрядчика, ${mobile ? 'мобильная' : 'компьютерная'} версия`}>
      <ContractorSidebar mobile={mobile} onNavigate={navigate} />
      <div className="contractor-workspace">
        <ContractorTopbar mobile={mobile} onCreateTask={onCreateTask} onNotifications={onNotifications} onNavigate={navigate} />
        <div className="contractor-content">
          <section className="contractor-welcome app-enter app-enter--1">
            <div><span>Оперативная сводка</span><h1>Доброе утро, Александр</h1><p>На трёх объектах работают 42 человека. Пять событий требуют решения.</p></div>
            {!mobile ? <div className="contractor-welcome__sync"><CheckCircle2 size={16} /><span><b>Данные актуальны</b><small>обновлено только что</small></span></div> : null}
          </section>

          <section className="contractor-metrics app-enter app-enter--2" aria-label="Оперативные показатели">
            {contractorMetrics.map(({ label, value, suffix, detail, note, progress, progressLabel, tone, icon: Icon, background }) => (
              <article className={`contractor-metric contractor-metric--${tone}`} key={label}>
                <img className="contractor-metric__background" src={background} alt="" aria-hidden="true" />
                <header className="contractor-metric__header">
                  <span className="contractor-metric__icon"><Icon size={18} /></span>
                  <span className="contractor-metric__label">{label}</span>
                  <span className="contractor-metric__badge">{progressLabel}</span>
                </header>
                <div className="contractor-metric__value"><strong>{value}</strong><span>{suffix}</span></div>
                <p className="contractor-metric__detail">{detail}</p>
                <footer className="contractor-metric__footer">
                  <span>{note}</span>
                  {typeof progress === 'number' ? <i aria-label={`${progress}%`}><b style={{ width: `${progress}%` }} /></i> : null}
                </footer>
              </article>
            ))}
          </section>

          <section className="contractor-section app-enter app-enter--3">
            <header><div><span>Стройплощадки</span><h2>Объекты сегодня</h2></div><button type="button" onClick={() => navigate('Все объекты')}>Все объекты<ChevronRight size={16} /></button></header>
            <div className="contractor-objects">
              {contractorObjects.map((object) => <ContractorObjectCard object={object} mobile={mobile} onOpen={(name) => onNotify(`Открываем ${name}`)} key={object.name} />)}
            </div>
          </section>

          <div className="contractor-dashboard-grid app-enter app-enter--4">
            <section className="contractor-panel contractor-panel--attention">
              <header><div><span>Приоритет</span><h2>Требует внимания</h2></div><strong>5</strong></header>
              <div className="contractor-attention-list">
                {contractorAttention.map((item) => (
                  <button type="button" onClick={() => item.tone === 'critical' ? onOpenIssue() : onNotify(`Открываем: ${item.title}`)} key={item.title}>
                    <span className={`attention-dot attention-dot--${item.tone}`}><AlertTriangle size={16} /></span>
                    <span><small>{item.type}</small><b>{item.title}</b><em>{item.meta}</em></span>
                    <time>{item.time}</time><ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </section>

            <section className="contractor-panel contractor-panel--tasks">
              <header><div><span>План / факт</span><h2>Ключевые работы</h2></div><button type="button" aria-label="Открыть фильтры" onClick={() => navigate('Фильтры')}><SlidersHorizontal size={17} />{mobile ? '' : 'Фильтр'}</button></header>
              <div className="contractor-task-list">
                {contractorTasks.map((task) => (
                  <button type="button" onClick={() => onNotify(`Паспорт задачи: ${task.task}`)} key={task.task}>
                    <span className={`task-tone task-tone--${task.tone}`} />
                    <span className="contractor-task-list__name"><b>{task.task}</b><small>{task.object} · {task.people}</small></span>
                    {!mobile ? <><span><small>План</small><b>{task.plan}</b></span><span><small>Заявлено</small><b>{task.reported}</b></span><span><small>Подтверждено</small><b>{task.confirmed}</b></span></> : null}
                    {mobile ? <span className="contractor-task-mobile-facts"><small>Заявлено <b>{task.reported}</b> из {task.plan}</small><small>Подтверждено <b>{task.confirmed}</b></small></span> : null}
                    <span className="contractor-task-list__progress"><i><em style={{ width: `${task.progress}%` }} /></i><b>{task.progress}%</b></span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
              <footer><button type="button" onClick={() => navigate('Отчёт за день')}><Download size={16} />Скачать сводку</button><button type="button" onClick={() => navigate('Все задачи')}>Открыть все задачи<ArrowUpRight size={15} /></button></footer>
            </section>
          </div>
        </div>
        {mobile ? <nav className="contractor-mobile-nav" aria-label="Навигация подрядчика"><button className="is-active" type="button"><Home size={19} /><span>Обзор</span></button><button type="button" onClick={() => navigate('Объекты')}><Building2 size={19} /><span>Объекты</span></button><button type="button" onClick={() => navigate('Задачи')}><ClipboardList size={19} /><span>Задачи</span><i>5</i></button><button type="button" onClick={() => navigate('Команда')}><Users size={19} /><span>Команда</span></button></nav> : null}
      </div>
    </section>
  )
}

const initialTaskStages = [
  { id: 1, name: 'Подготовить основание', measured: false, amount: '1', unit: 'этап' },
  { id: 2, name: 'Выполнить основную работу', measured: true, amount: '120', unit: 'м²' },
]

const taskAssigneeOptions = [
  { id: 'ivanov', initials: 'ИИ', name: 'Иванов И.И.', trade: 'Плиточник', status: 'На смене', tone: 'blue' },
  { id: 'fedorov', initials: 'АФ', name: 'Фёдоров А.В.', trade: 'Плиточник', status: 'На смене', tone: 'cyan' },
  { id: 'smirnov', initials: 'МС', name: 'Смирнов М.С.', trade: 'Плиточник', status: 'На смене', tone: 'green' },
  { id: 'orlov', initials: 'АО', name: 'Орлов А.О.', trade: 'Подсобный рабочий', status: 'На смене', tone: 'orange' },
  { id: 'sidorov', initials: 'МВ', name: 'Сидоров М.В.', trade: 'Бетонщик', status: 'На смене', tone: 'violet' },
  { id: 'kuznetsov', initials: 'ДА', name: 'Кузнецов Д.А.', trade: 'Разнорабочий', status: 'Не на связи', tone: 'slate' },
]

const savedTaskTeams = [
  { id: 'team-2', name: 'Бригада №2', detail: 'Плиточные работы', memberIds: ['ivanov', 'fedorov', 'smirnov', 'orlov', 'kuznetsov'], responsibleId: 'ivanov' },
  { id: 'team-finish', name: 'Отделочники', detail: 'Секция Б', memberIds: ['ivanov', 'fedorov', 'smirnov'], responsibleId: 'fedorov' },
]

function formatPeopleCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'человек' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'человека' : 'человек'
  return `${count} ${word}`
}

function TaskComposer({ online, onClose, onComplete }) {
  const firstInput = useRef(null)
  const [title, setTitle] = useState('Подготовить основание')
  const [hasVolume, setHasVolume] = useState(false)
  const [hasStages, setHasStages] = useState(false)
  const [stages, setStages] = useState(initialTaskStages)
  const [assignmentView, setAssignmentView] = useState('people')
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState(['ivanov'])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [responsibleId, setResponsibleId] = useState('ivanov')
  const [reviewRequired, setReviewRequired] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [photoRequired, setPhotoRequired] = useState(false)

  const mode = hasStages ? 'Количество и этапы' : hasVolume ? 'Количество' : 'Отметка «Готово»'
  const modeNote = hasStages
    ? `${stages.length} ${stages.length === 1 ? 'этап' : stages.length < 5 ? 'этапа' : 'этапов'} и общий итог`
    : hasVolume
      ? 'Общий объём и план дня разделены'
      : 'Исполнитель просто отметит выполнение'
  const selectedAssignees = taskAssigneeOptions.filter((person) => selectedAssigneeIds.includes(person.id))
  const selectedTeam = savedTaskTeams.find((team) => team.id === selectedTeamId)
  const normalizedSearch = assigneeSearch.trim().toLocaleLowerCase('ru-RU')
  const filteredAssignees = taskAssigneeOptions.filter((person) => !normalizedSearch || `${person.name} ${person.trade}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch))
  const isGroupAssignment = selectedAssignees.length > 1
  const selectedResponsible = selectedAssignees.find((person) => person.id === responsibleId)
  const assignmentTitle = selectedTeam
    ? `${selectedTeam.name} · ${formatPeopleCount(selectedAssignees.length)}`
    : selectedAssignees.length === 1
      ? selectedAssignees[0].name
      : selectedAssignees.length > 1
        ? `${formatPeopleCount(selectedAssignees.length)} выбрано`
        : 'Исполнители не выбраны'
  const assignmentDetail = selectedTeam
    ? 'Состав команды сохранён снимком задачи'
    : selectedAssignees.length > 1
      ? selectedAssignees.map((person) => person.name.split(' ')[0]).join(', ')
      : selectedAssignees.length === 1
        ? 'Ответственный автоматически'
        : 'Выберите хотя бы одного сотрудника'

  useEffect(() => {
    const timer = window.setTimeout(() => firstInput.current?.focus(), 100)
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    setResponsibleId((current) => {
      if (selectedAssigneeIds.length === 1) return selectedAssigneeIds[0]
      return selectedAssigneeIds.includes(current) ? current : ''
    })
  }, [selectedAssigneeIds])

  const enableVolume = () => {
    setHasVolume((value) => !value)
    if (!hasVolume) setReviewRequired(true)
  }

  const enableStages = () => {
    setHasStages((value) => !value)
    if (!hasStages) setReviewRequired(true)
  }

  const updateStage = (id, patch) => {
    setStages((items) => items.map((stage) => stage.id === id ? { ...stage, ...patch } : stage))
  }

  const addStage = () => {
    setStages((items) => [
      ...items,
      { id: Math.max(0, ...items.map((item) => item.id)) + 1, name: '', measured: false, amount: '1', unit: 'этап' },
    ])
  }

  const removeStage = (id) => {
    setStages((items) => items.length === 1 ? items : items.filter((stage) => stage.id !== id))
  }

  const toggleAssignee = (id) => {
    setSelectedTeamId(null)
    setSelectedAssigneeIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  }

  const selectAllAvailable = () => {
    setSelectedTeamId(null)
    setSelectedAssigneeIds(taskAssigneeOptions.map((person) => person.id))
  }

  const selectSavedTeam = (team) => {
    setSelectedTeamId(team.id)
    setSelectedAssigneeIds(team.memberIds)
    setResponsibleId(team.responsibleId)
  }

  const submitTask = (event) => {
    event.preventDefault()
    if (!title.trim() || !online || selectedAssignees.length === 0) return
    const target = selectedTeam
      ? selectedTeam.name
      : selectedAssignees.length === 1
        ? selectedAssignees[0].name
        : `${selectedAssignees.length} выбранных сотрудников`
    onComplete(`Задача поставлена для ${target}`)
  }

  return (
    <div className="sheet-backdrop task-composer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-composer" role="dialog" aria-modal="true" aria-labelledby="task-composer-title">
        <header className="task-composer__header">
          <div className="task-composer__heading">
            <span className="task-composer__kicker">Новая задача</span>
            <h2 id="task-composer-title">Что нужно сделать?</h2>
            <p>Начните с главного. Объём и этапы добавятся только если они нужны.</p>
          </div>
          <IconButton label="Закрыть форму" onClick={onClose}><X size={21} /></IconButton>
        </header>

        <form className="task-composer__form" onSubmit={submitTask}>
          <div className="task-composer__scroll">
            <div className="task-composer__main">
              <section className="composer-section composer-section--primary" aria-labelledby="task-main-heading">
                <div className="composer-section__number">01</div>
                <div className="composer-section__body">
                  <div className="composer-section__title"><div><h3 id="task-main-heading">Задача</h3><p>Коротко и по делу — это увидит исполнитель.</p></div><span className="required-mark">Обязательно</span></div>
                  <label className="composer-field composer-field--hero">
                    <span>Что сделать</span>
                    <input ref={firstInput} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, убрать мусор в секции Б" required />
                  </label>
                  <div className="composer-grid composer-grid--place">
                    <label className="composer-field"><span>Объект</span><select defaultValue="ЖК Северный"><option>ЖК Северный</option><option>БЦ Горизонт</option><option>Школа №18</option></select></label>
                    <label className="composer-field"><span>Зона</span><select defaultValue="Этаж 3 · Секция Б"><option>Этаж 3 · Секция Б</option><option>Этаж 2</option><option>Двор</option></select></label>
                  </div>
                </div>
              </section>

              <section className="composer-section" aria-labelledby="task-assignment-heading">
                <div className="composer-section__number">02</div>
                <div className="composer-section__body">
                  <div className="composer-section__title"><div><h3 id="task-assignment-heading">Кто и когда</h3><p>Выберите одного человека, несколько конкретных сотрудников или готовую команду.</p></div></div>
                  <div className="assignment-source-tabs" role="tablist" aria-label="Способ выбора исполнителей">
                    <button type="button" role="tab" aria-selected={assignmentView === 'people'} className={assignmentView === 'people' ? 'is-selected' : ''} onClick={() => setAssignmentView('people')}><UserRound size={17} />Сотрудники</button>
                    <button type="button" role="tab" aria-selected={assignmentView === 'teams'} className={assignmentView === 'teams' ? 'is-selected' : ''} onClick={() => setAssignmentView('teams')}><Users size={17} />Готовые команды</button>
                  </div>

                  {assignmentView === 'people' ? <div className="assignee-picker" role="tabpanel">
                    <div className="assignee-picker__tools">
                      <label><Search size={16} /><input value={assigneeSearch} onChange={(event) => setAssigneeSearch(event.target.value)} placeholder="Найти по имени или профессии" aria-label="Найти сотрудника" /></label>
                      <button type="button" onClick={selectAllAvailable}>Выбрать всех</button>
                    </div>
                    <div className="assignee-picker__list" role="group" aria-label="Доступные сотрудники объекта">
                      {filteredAssignees.map((person) => {
                        const selected = selectedAssigneeIds.includes(person.id)
                        return <button type="button" aria-pressed={selected} className={selected ? 'is-selected' : ''} onClick={() => toggleAssignee(person.id)} key={person.id}><Avatar initials={person.initials} tone={person.tone} small /><span><b>{person.name}</b><small>{person.trade} · {person.status}</small></span><i>{selected ? <Check size={15} /> : <Plus size={15} />}</i></button>
                      })}
                      {filteredAssignees.length === 0 ? <div className="assignee-picker__empty"><Search size={18} /><span><b>Никого не найдено</b><small>Измените имя или профессию в поиске.</small></span></div> : null}
                    </div>
                  </div> : <div className="saved-team-list" role="tabpanel" aria-label="Сохранённые команды">
                    {savedTaskTeams.map((team) => {
                      const active = selectedTeamId === team.id
                      const members = taskAssigneeOptions.filter((person) => team.memberIds.includes(person.id))
                      return <button type="button" aria-pressed={active} className={active ? 'is-selected' : ''} onClick={() => selectSavedTeam(team)} key={team.id}><span className="assignment-team-icon"><Users size={19} /></span><span><b>{team.name}</b><small>{team.detail} · {formatPeopleCount(members.length)}</small><em>{members.slice(0, 4).map((person) => person.initials).join(' · ')}</em></span>{active ? <CheckCircle2 size={19} /> : <ChevronRight size={18} />}</button>
                    })}
                  </div>}

                  <div className={`assignment-selection-summary ${selectedAssignees.length === 0 ? 'is-empty' : ''}`}>
                    <span className="assignment-selection-summary__avatars">{selectedAssignees.slice(0, 4).map((person) => <i key={person.id}>{person.initials}</i>)}{selectedAssignees.length > 4 ? <i>+{selectedAssignees.length - 4}</i> : null}</span>
                    <span><small>{selectedTeam ? 'Готовая команда' : selectedAssignees.length === 1 ? 'Один исполнитель' : 'Выбранные сотрудники'}</small><b>{assignmentTitle}</b><em>{assignmentDetail}</em></span>
                  </div>
                  <div className="composer-grid">
                    <label className="composer-field"><span>День</span><select defaultValue="Сегодня, 23 мая"><option>Сегодня, 23 мая</option><option>Завтра, 24 мая</option><option>Выбрать дату</option></select></label>
                    <label className="composer-field"><span>Выполнить до <em>необязательно</em></span><input type="time" defaultValue="" /></label>
                  </div>
                  {isGroupAssignment ? (
                    <label className="composer-field composer-field--responsible">
                      <span><UserCheck size={15} /> Ответственный за общий результат</span>
                      <select value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)}><option value="">Не выбирать сейчас</option>{selectedAssignees.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select>
                      <small>{selectedResponsible ? `${selectedResponsible.name} отправит общий итог. Остальные сохранят право добавлять фото, комментарии и проблемы.` : 'Без ответственного задача сохранится с риском. Участник сможет взять ответственность, а руководитель — назначить её позже.'}</small>
                    </label>
                  ) : null}
                </div>
              </section>

              <section className="composer-section" aria-labelledby="task-result-heading">
                <div className="composer-section__number">03</div>
                <div className="composer-section__body">
                  <div className="composer-section__title"><div><h3 id="task-result-heading">Как отметят результат</h3><p>По умолчанию достаточно отметки «Готово». Добавьте количество или этапы, только если они нужны.</p></div></div>
                  <div className="result-mode-card">
                    <span className={`result-mode-card__icon ${hasStages ? 'is-stages' : hasVolume ? 'is-volume' : ''}`}>{hasStages ? <Layers3 size={22} /> : hasVolume ? <Ruler size={22} /> : <Check size={22} />}</span>
                    <div><b>{mode}</b><span>{modeNote}</span></div>
                  </div>
                  <div className="result-addons" role="group" aria-label="Дополнить результат задачи">
                    <button type="button" className={hasVolume ? 'is-selected' : ''} onClick={enableVolume}><Ruler size={18} /><span><b>{hasVolume ? 'Объём добавлен' : 'Добавить объём'}</b><small>Количество и единица</small></span>{hasVolume ? <Check size={17} /> : <Plus size={17} />}</button>
                    <button type="button" className={hasStages ? 'is-selected' : ''} onClick={enableStages}><Layers3 size={18} /><span><b>{hasStages ? 'Этапы добавлены' : 'Добавить этапы'}</b><small>Только один уровень</small></span>{hasStages ? <Check size={17} /> : <Plus size={17} />}</button>
                  </div>

                  {hasVolume ? (
                    <div className="volume-builder composer-reveal">
                      <div className="volume-builder__heading"><Ruler size={18} /><div><b>Измеримый результат</b><span>Общий объём и план этого дня — разные значения.</span></div></div>
                      <div className="composer-grid composer-grid--volume">
                        <label className="composer-field"><span>Общий объём работы</span><input inputMode="decimal" defaultValue="500" /></label>
                        <label className="composer-field"><span>Единица</span><select defaultValue="м²"><option>м²</option><option>м³</option><option>м.п.</option><option>шт.</option><option>компл.</option></select></label>
                        <label className="composer-field"><span>План на сегодня</span><input inputMode="decimal" defaultValue="120" /></label>
                      </div>
                    </div>
                  ) : null}

                  {hasStages ? (
                    <div className="stage-builder composer-reveal">
                      <header><div><b>Этапы работы</b><span>Без подэтапов. Каждый этап может быть простым или измеримым.</span></div><span>{stages.length}</span></header>
                      <div className="stage-builder__list">
                        {stages.map((stage, index) => (
                          <div className="stage-row" key={stage.id}>
                            <span className="stage-row__order">{String(index + 1).padStart(2, '0')}</span>
                            <div className="stage-row__content">
                              <input aria-label={`Название этапа ${index + 1}`} value={stage.name} onChange={(event) => updateStage(stage.id, { name: event.target.value })} placeholder="Название этапа" />
                              <label className="stage-measure"><input type="checkbox" checked={stage.measured} onChange={(event) => updateStage(stage.id, { measured: event.target.checked })} /><span>Есть количество</span></label>
                              {stage.measured ? <div className="stage-amount"><input aria-label={`Количество этапа ${index + 1}`} inputMode="decimal" value={stage.amount} onChange={(event) => updateStage(stage.id, { amount: event.target.value })} /><select aria-label={`Единица этапа ${index + 1}`} value={stage.unit} onChange={(event) => updateStage(stage.id, { unit: event.target.value })}><option>м²</option><option>шт.</option><option>точек</option><option>м.п.</option></select></div> : null}
                            </div>
                            <button type="button" className="stage-row__remove" aria-label={`Удалить этап ${index + 1}`} onClick={() => removeStage(stage.id)} disabled={stages.length === 1}><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                      <button className="add-stage-button" type="button" onClick={addStage}><Plus size={17} />Добавить этап</button>
                    </div>
                  ) : null}

                  <label className="composer-toggle">
                    <input type="checkbox" checked={reviewRequired} onChange={(event) => setReviewRequired(event.target.checked)} />
                    <span className="composer-toggle__control" />
                    <span><b>Проверить результат перед закрытием</b><small>{hasVolume || hasStages ? 'Рекомендуется для объёмной и составной работы' : 'Для простого поручения необязательно'}</small></span>
                    <ShieldCheck size={19} />
                  </label>
                </div>
              </section>

              <section className={`composer-section composer-section--advanced ${advancedOpen ? 'is-open' : ''}`}>
                <div className="composer-section__number">04</div>
                <div className="composer-section__body">
                  <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}><span><b>Дополнительные параметры</b><small>Приоритет, фотоотчёт и инструкция</small></span><ChevronDown size={19} /></button>
                  {advancedOpen ? <div className="advanced-fields composer-reveal">
                    <div className="composer-grid">
                      <label className="composer-field"><span>Приоритет</span><select defaultValue="Обычный"><option>Обычный</option><option>Срочно</option><option>Низкий</option></select></label>
                      <label className="composer-toggle composer-toggle--compact"><input type="checkbox" checked={photoRequired} onChange={(event) => setPhotoRequired(event.target.checked)} /><span className="composer-toggle__control" /><span><b>Нужен фотоотчёт</b><small>Одна кнопка добавления фото</small></span><ImagePlus size={18} /></label>
                    </div>
                    <label className="composer-field"><span>Инструкция или комментарий</span><textarea placeholder="Добавьте важные детали, требования или ссылку на документ" /></label>
                  </div> : null}
                </div>
              </section>
            </div>

            <aside className="task-summary" aria-label="Проверка задачи">
              <div className="task-summary__sticky">
                <span className="task-summary__kicker">Перед созданием</span>
                <div className={`task-summary__mode ${hasStages ? 'is-stages' : hasVolume ? 'is-volume' : ''}`}><span>{hasStages ? <Layers3 size={20} /> : hasVolume ? <Ruler size={20} /> : <Check size={20} />}</span><div><b>{mode}</b><small>{modeNote}</small></div></div>
                <dl>
                  <div><dt>Что сделать</dt><dd>{title.trim() || 'Не указано'}</dd></div>
                  <div><dt>Где</dt><dd>ЖК Северный<br /><span>Этаж 3 · Секция Б</span></dd></div>
                  <div><dt>Кто</dt><dd>{assignmentTitle}<span>{isGroupAssignment ? selectedResponsible ? `Ответственный: ${selectedResponsible.name}` : 'Ответственный не выбран · есть риск' : selectedAssignees.length === 1 ? 'Ответственный автоматически' : 'Нужно выбрать исполнителя'}</span></dd></div>
                  <div><dt>Когда</dt><dd>Сегодня, 23 мая</dd></div>
                  <div><dt>Проверка</dt><dd>{reviewRequired ? 'Обязательна' : 'Не требуется'}</dd></div>
                </dl>
                <div className="task-summary__hint"><ShieldCheck size={17} /><p><b>Проверьте главное</b><span>Исполнитель увидит только выбранные условия и действия.</span></p></div>
              </div>
            </aside>
          </div>

          <footer className="task-composer__footer">
            <div className={`composer-network ${online ? '' : 'is-offline'}`}>{online ? <CheckCircle2 size={17} /> : <CloudOff size={17} />}<span><b>{online ? 'Можно создавать' : 'Нет сети'}</b><small>{online ? 'Изменения будут отправлены сразу' : 'Новая задача требует подключения'}</small></span></div>
            <button className="task-draft-button" type="button" disabled={!online} onClick={() => onComplete('Черновик задачи сохранён')}><Save size={17} />Сохранить черновик</button>
            <button className="task-create-button" type="submit" disabled={!online || !title.trim() || selectedAssignees.length === 0}><Plus size={18} />Поставить задачу</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ActionSheet({ type, online, problemContext = 'general', issueStatus = 'open', issuePerspective = 'worker', onIssueTransition, onClose, onComplete }) {
  const firstInput = useRef(null)
  const [selectedIssue, setSelectedIssue] = useState('Нет материала')
  const [selectedImpact, setSelectedImpact] = useState('Работа замедлена')
  const [issueText, setIssueText] = useState('')
  const [volumeAmount, setVolumeAmount] = useState('24')
  const [stageAmount, setStageAmount] = useState('3')
  const [photoCount, setPhotoCount] = useState(() => ['result-simple', 'result-delivery', 'result-photo', 'problem'].includes(type) ? 0 : type === 'result-stages' ? 2 : 4)
  const [issueComment, setIssueComment] = useState('')
  const [issueUpdates, setIssueUpdates] = useState([
    { id: 'created', time: '09:18', author: 'Иванов И.И.', text: 'Сообщил: материала хватит примерно на один рабочий день.' },
    { id: 'routed', time: '09:19', author: 'Система', text: 'Проблема назначена бригадиру Петрову А.С.' },
  ])
  const [linkedIssueTask, setLinkedIssueTask] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => firstInput.current?.focus(), 80)
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKeyDown) }
  }, [onClose])

  const addPhoto = () => setPhotoCount((count) => count + 1)
  const photoTitle = photoCount ? `${photoCount} фото прикреплено` : 'Добавить фото'
  const volumeIsValid = Number(volumeAmount.replace(',', '.')) > 0
  const stageIsValid = stageAmount.trim() !== '' && Number(stageAmount) >= 0 && Number(stageAmount) <= 8
  const issueContext = {
    general: { title: 'ЖК «Северный» · Корпус 4', detail: 'Проблема по объекту', icon: Building2 },
    simple: { title: 'Убрать мусор в секции Б', detail: 'Этаж 3 · Секция Б', icon: Check },
    delivery: { title: 'Принять материал', detail: 'Зона разгрузки · Корпус 4', icon: Package },
    photo: { title: 'Сделать итоговую фотографию', detail: 'Этаж 3 · Секция Б', icon: Camera },
    volume: { title: 'Укладка плитки', detail: 'Этаж 3 · Секция Б', icon: Ruler },
    stages: { title: 'Установить 8 светильников', detail: 'Этаж 2 · Коридор А', icon: Layers3 },
  }[problemContext]
  const IssueContextIcon = issueContext.icon
  const currentIssueStatus = issueStatuses[issueStatus]
  const issueTransition = {
    open: { next: 'accepted', action: 'Принять проблему', message: 'Проблема принята ответственным' },
    accepted: { next: 'in_progress', action: 'Начать решение', message: 'Решение проблемы начато' },
    in_progress: { next: 'resolved', action: 'Отметить решённой', message: 'Проблема отмечена как решённая' },
    resolved: { next: 'closed', action: 'Закрыть проблему', message: 'Проблема закрыта' },
    closed: { next: 'reopened', action: 'Открыть повторно', message: 'Проблема открыта повторно' },
    reopened: { next: 'accepted', action: 'Принять повторно', message: 'Повторно открытая проблема принята' },
  }[issueStatus]
  const issueManager = issuePerspective === 'foreman' || issuePerspective === 'contractor'
  const workerCanResolve = issuePerspective === 'worker' && (issueStatus === 'resolved' || issueStatus === 'closed')
  const issuePrimaryAction = issueManager
    ? issueTransition.action
    : issueStatus === 'resolved'
      ? 'Подтвердить решение'
      : issueStatus === 'closed'
        ? 'Проблема осталась'
        : 'Закрыть карточку'
  const addIssueComment = () => {
    const text = issueComment.trim()
    if (!text) return
    setIssueUpdates((updates) => [...updates, { id: `comment-${Date.now()}`, time: 'сейчас', author: issuePerspective === 'worker' ? 'Иванов И.И.' : issuePerspective === 'foreman' ? 'Петров А.С.' : 'Александр Романов', text }])
    setIssueComment('')
  }
  const createIssueTask = () => {
    setLinkedIssueTask(true)
    setIssueUpdates((updates) => [...updates, { id: `task-${Date.now()}`, time: 'сейчас', author: issuePerspective === 'foreman' ? 'Петров А.С.' : 'Александр Романов', text: 'Создана связанная задача #СМ-251 «Доставить плиточный клей».' }])
  }

  const volumeResult = {
    eyebrow: 'Результат за сегодня',
    title: 'Добавить выполненный объём',
    body: (
      <>
        <div className="result-progress-context"><span><Ruler size={21} /></span><div><small>Уже внесено сегодня</small><b>96 из 150 м²</b><p>Добавляйте только объём после последней отметки.</p></div></div>
        <label className="field"><span>Сколько добавить?</span><div className="input-with-unit"><input ref={firstInput} value={volumeAmount} onChange={(event) => setVolumeAmount(event.target.value)} inputMode="decimal" aria-describedby="volume-result-hint" /><b>м²</b></div><small id="volume-result-hint" className="field-hint">Число прибавится к сегодняшнему результату.</small></label>
        <div className="upload-card"><Camera size={22} /><div><strong>{photoTitle}</strong><span>{photoCount ? (online ? 'Сохранятся вместе с результатом' : 'Загрузятся после появления сети') : 'Необязательно · камера или галерея одной кнопкой'}</span></div><button type="button" aria-label="Добавить фото" onClick={addPhoto}><Plus size={17} /></button></div>
        <label className="field"><span>Комментарий проверяющему <em>необязательно</em></span><textarea placeholder="Что сделано и где смотреть" /></label>
      </>
    ),
    action: online ? 'Сохранить результат' : 'Сохранить на телефоне',
    message: online ? `Добавлено ${volumeAmount} м²` : `Результат ${volumeAmount} м² сохранён на телефоне`,
    disabled: !volumeIsValid,
  }

  const simpleTaskTitle = {
    'result-simple': 'Убрать мусор в секции Б',
    'result-delivery': 'Принять материал',
    'result-photo': 'Сделать итоговую фотографию',
  }[type] || 'Текущее поручение'
  const simpleResult = {
    eyebrow: 'Результат поручения',
    title: 'Отметить задачу выполненной',
    body: (
      <>
        <div className="simple-result-confirm"><span><CheckCircle2 size={24} /></span><div><b>{simpleTaskTitle}</b><p>Проверка не требуется. После сохранения задача будет закрыта.</p></div></div>
        <div className="upload-card"><Camera size={22} /><div><strong>{photoTitle}</strong><span>{photoCount ? (online ? 'Сохранится вместе с выполнением' : 'Загрузится после появления сети') : 'Необязательно · камера или галерея одной кнопкой'}</span></div><button type="button" aria-label="Добавить фото" onClick={addPhoto}><Plus size={17} /></button></div>
        <label className="field"><span>Комментарий <em>необязательно</em></span><textarea ref={firstInput} placeholder="Добавьте важное уточнение" /></label>
      </>
    ),
    action: online ? 'Отметить «Готово»' : 'Сохранить «Готово»',
    message: online ? 'Задача выполнена в 10:34' : 'Выполнение сохранено на телефоне',
  }

  const stagesResult = {
    eyebrow: 'Результат за сегодня',
    title: 'Обновить выполненную работу',
    body: (
      <>
        <div className="stage-result-sheet__total"><span><Layers3 size={22} /></span><div><small>Главный результат</small><b>Установлено светильников</b><p>Укажите полностью готовое количество, а не сумму этапов.</p></div></div>
        <label className="field"><span>Полностью установлено</span><div className="input-with-unit"><input ref={firstInput} value={stageAmount} onChange={(event) => setStageAmount(event.target.value)} inputMode="numeric" min="0" max="8" /><b>из 8 шт.</b></div></label>
        <div className="stage-result-sheet__list" aria-label="Состояние этапов"><span className="is-done"><Check size={15} />Проводка <b>8/8</b></span><span className="is-done"><Check size={15} />Крепления <b>8/8</b></span><span className="is-active"><Clock3 size={15} />Установка <b>{stageAmount || '0'}/8</b></span><span>Проверка и уборка <b>ожидает</b></span></div>
        <div className="upload-card"><Camera size={22} /><div><strong>{photoTitle}</strong><span>{online ? 'Сохранятся вместе с результатом' : 'Загрузятся после появления сети'}</span></div><button type="button" aria-label="Добавить фото" onClick={addPhoto}><Plus size={17} /></button></div>
        <label className="field"><span>Комментарий <em>необязательно</em></span><textarea placeholder="Что сделано на этом шаге" /></label>
      </>
    ),
    action: online ? 'Сохранить прогресс' : 'Сохранить на телефоне',
    message: online ? 'Прогресс этапов сохранён' : 'Прогресс этапов сохранён на телефоне',
    disabled: !stageIsValid,
  }

  const content = {
    problem: {
      eyebrow: 'Новая проблема',
      title: 'Что мешает работе?',
      body: (
        <>
          <div className="problem-create-context"><span><IssueContextIcon size={20} /></span><div><small>{problemContext === 'general' ? 'Контекст объекта' : 'Проблема в задаче'}</small><b>{issueContext.title}</b><p>{issueContext.detail}</p></div><CheckCircle2 size={18} /></div>
          <div className="sheet-field-heading"><b>Причина</b><small>Выберите наиболее подходящий вариант</small></div>
          <div className="issue-options" role="group" aria-label="Причина проблемы">
            {['Нет материала', 'Инструмент', 'Нет доступа', 'Непонятна задача', 'Обнаружен дефект', 'Опасная ситуация', 'Другое'].map((issue) => (
              <button type="button" className={selectedIssue === issue ? 'is-selected' : ''} onClick={() => setSelectedIssue(issue)} key={issue}>
                {selectedIssue === issue ? <Check size={16} /> : null}{issue}
              </button>
            ))}
          </div>
          <div className="sheet-field-heading"><b>Как влияет на работу?</b></div>
          <div className="issue-impact-options" role="group" aria-label="Влияние проблемы на работу">
            {['Можно продолжать', 'Работа замедлена', 'Работа остановлена'].map((impact) => <button type="button" className={selectedImpact === impact ? 'is-selected' : ''} onClick={() => setSelectedImpact(impact)} key={impact}>{selectedImpact === impact ? <Check size={15} /> : null}<span>{impact}</span></button>)}
          </div>
          <label className="field"><span>Что произошло?</span><textarea ref={firstInput} value={issueText} onChange={(event) => setIssueText(event.target.value)} placeholder="Например: плиточного клея осталось примерно на час" required /></label>
          <div className="upload-card"><Camera size={22} /><div><strong>{photoTitle}</strong><span>{photoCount ? (online ? 'Отправятся вместе с проблемой' : 'Загрузятся после появления сети') : 'Необязательно · добавьте, если по фото понятнее'}</span></div><button type="button" aria-label="Добавить фото" onClick={addPhoto}><Plus size={17} /></button></div>
        </>
      ),
      action: online ? 'Сообщить о проблеме' : 'Сохранить на телефоне',
      message: online ? `Проблема «${selectedIssue}» отправлена ответственному` : `Проблема «${selectedIssue}» сохранена на телефоне`,
      disabled: !issueText.trim(),
    },
    result: volumeResult,
    'result-volume': volumeResult,
    'result-simple': simpleResult,
    'result-delivery': simpleResult,
    'result-photo': simpleResult,
    'result-stages': stagesResult,
    'issue-detail': {
      eyebrow: 'Проблема #ПР-031',
      title: 'Нет материала',
      body: (
        <>
          <div className="issue-detail-context"><span className="soft-icon soft-icon--orange"><Package size={21} /></span><div><small>Связана с задачей</small><b>Кладка стен</b><p><MapPin size={14} /> Этаж 4 · Секция А</p></div><em>Работа замедлена</em></div>
          <div className="issue-detail-status"><header><span>Статус</span><b>{currentIssueStatus.label}</b></header><div aria-label="Этапы решения проблемы">{issueSteps.map((step, index) => <span className={index === currentIssueStatus.step ? 'is-active' : index < currentIssueStatus.step ? 'is-complete' : ''} key={step.key}><i />{step.label}</span>)}</div></div>
          <div className="issue-detail-routing"><small>Маршрут решения</small><div><span><Avatar initials="ИИ" tone="blue" small /><b>Иванов И.И.</b><em>сообщил</em></span><ChevronRight size={16} /><span><Avatar initials="АС" tone="orange" small /><b>Петров А.С.</b><em>ответственный</em></span></div><p>Назначено бригадиру объекта автоматически. Если работа остановится или ответа не будет, событие увидит подрядчик.</p></div>
          <div className="issue-detail-description"><small>Что произошло</small><p>Керамического камня осталось 120 штук — запаса хватит примерно на один рабочий день. Нужна поставка, чтобы работа не остановилась.</p></div>
          <div className="issue-detail-people"><span><Avatar initials="ИИ" tone="blue" small /><p><small>Сообщил</small><b>Иванов И.И. · 09:18</b></p></span><span><Avatar initials="АС" tone="orange" small /><p><small>Ответственный</small><b>Петров А.С.</b></p></span></div>
          <section className="issue-detail-materials" aria-label="Материалы проблемы">
            <header><div><small>Материалы</small><b>Фото и документы</b></div><span>2 файла</span></header>
            <div><button type="button" onClick={() => onComplete('Открываем фото проблемы')}><ImagePlus size={17} /><span><b>Остаток материала.jpg</b><small>Иванов И.И. · 09:18</small></span><ChevronRight size={16} /></button><button type="button" onClick={() => onComplete('Открываем накладную')}><FileText size={17} /><span><b>Накладная поставки.pdf</b><small>248 КБ · доступна офлайн</small></span><ChevronRight size={16} /></button></div>
          </section>
          {issueManager ? <section className="issue-detail-decision" aria-label="Управленческое решение"><header><div><small>Официальный ответ</small><b>{issueStatus === 'open' ? 'Нужно принять проблему' : 'Материал запрошен у снабжения'}</b></div><ShieldCheck size={19} /></header><p>{issueStatus === 'open' ? 'После принятия рабочий увидит, кто отвечает за решение.' : 'Ожидаем подтверждение доставки до 12:00. Работа продолжается на доступном участке.'}</p><button type="button" disabled={!online || linkedIssueTask} onClick={createIssueTask}>{linkedIssueTask ? <CheckCircle2 size={16} /> : <Plus size={16} />}{linkedIssueTask ? 'Задача #СМ-251 связана' : 'Создать задачу на решение'}</button></section> : <section className="issue-detail-decision is-worker" aria-label="Ответ руководителя"><header><div><small>Ответ руководителя</small><b>{issueStatus === 'open' ? 'Ожидаем принятия' : 'Материал запрошен у снабжения'}</b></div><MessageCircle size={19} /></header><p>{issueStatus === 'open' ? 'Ответ и план решения появятся здесь без отдельного чата.' : 'Поставка ожидается до 12:00. Продолжайте работу на доступном участке.'}</p></section>}
          <section className="issue-detail-history" aria-label="История проблемы"><header><div><small>История</small><b>Решение и обсуждение</b></div><span>{issueUpdates.length}</span></header><div>{issueUpdates.map((update) => <article key={update.id}><time>{update.time}</time><p><b>{update.author}</b><span>{update.text}</span></p></article>)}</div><label><span>Комментарий в контексте проблемы</span><textarea value={issueComment} onChange={(event) => setIssueComment(event.target.value)} placeholder="Напишите уточнение или ответ" /></label><button type="button" disabled={!issueComment.trim()} onClick={addIssueComment}><MessageCircle size={16} />Добавить в историю</button></section>
          {!online ? <div className="responsibility-offline-note"><CloudOff size={18} /><p><b>Изменение статуса требует сети</b><span>Просмотр доступен офлайн, но управленческое решение не ставится в локальную очередь.</span></p></div> : null}
        </>
      ),
      action: online ? issuePrimaryAction : 'Нужно подключение',
      message: online ? issueTransition.message : '',
      disabled: !online,
      keepOpen: issueManager || workerCanResolve,
      closeOnly: !issueManager && !workerCanResolve,
    },
    notifications: {
      eyebrow: 'Центр событий',
      title: 'Уведомления',
      body: (
        <div className="notification-list">
          <button type="button" onClick={() => onComplete('Открываем проблему с материалом')}><span className="soft-icon soft-icon--orange"><AlertTriangle size={18} /></span><p><strong>Нет материала</strong><span>Плиточный клей закончится через 1 час</span><small>5 минут назад</small></p><ChevronRight size={17} /></button>
          <button type="button" onClick={() => onComplete('Открываем результат на проверке')}><span className="soft-icon soft-icon--blue"><FileText size={18} /></span><p><strong>Результат на проверке</strong><span>Бригада №2 отправила 72 м²</span><small>18 минут назад</small></p><ChevronRight size={17} /></button>
          <button type="button" onClick={() => onComplete('Открываем события табеля')}><span className="soft-icon soft-icon--green"><Check size={18} /></span><p><strong>Табель синхронизирован</strong><span>Все отметки за сегодня сохранены</span><small>1 час назад</small></p><ChevronRight size={17} /></button>
        </div>
      ),
      action: 'Закрыть',
      message: '',
    },
  }[type]

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`bottom-sheet bottom-sheet--${type}`} role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-grabber" />
        <header><div><span>{content.eyebrow}</span><h2 id="sheet-title">{content.title}</h2></div><IconButton label="Закрыть" onClick={onClose}><X size={21} /></IconButton></header>
        <div className="sheet-content">{content.body}</div>
        <button className="primary-gradient-button sheet-submit" type="button" disabled={content.disabled} onClick={() => content.closeOnly ? onClose() : content.keepOpen ? onIssueTransition(issueTransition.next, content.message) : onComplete(content.message)}>{content.action}</button>
      </section>
    </div>
  )
}

function Sheet({ type, online, problemContext, issueStatus, issuePerspective, onIssueTransition, onClose, onComplete }) {
  return type === 'create'
    ? <TaskComposer online={online} onClose={onClose} onComplete={onComplete} />
    : <ActionSheet type={type} online={online} problemContext={problemContext} issueStatus={issueStatus} issuePerspective={issuePerspective} onIssueTransition={onIssueTransition} onClose={onClose} onComplete={onComplete} />
}

function PrototypeToolbar({ role, screen, online, breakMode, shiftPhase, onView, onToggleNetwork, onBreakMode, onResetDay }) {
  const views = [
    { role: 'presentation', screen: 'deck', label: 'Презентация' },
    { role: 'contractor', screen: 'dashboard', label: 'Подрядчик · Desktop' },
    { role: 'contractor', screen: 'dashboard-mobile', label: 'Подрядчик · Mobile' },
    { role: 'worker', screen: 'home', label: 'Работник · Главная' },
    { role: 'worker', screen: 'tasks', label: 'Работник · Список задач' },
    { role: 'worker', screen: 'day', label: 'Работник · Мой день' },
    { role: 'worker', screen: 'task', label: 'Работник · Паспорт' },
    { role: 'foreman', screen: 'team', label: 'Бригадир · Команда' },
    { role: 'foreman', screen: 'attention', label: 'Бригадир · Контроль' },
    { role: 'assets', screen: 'gallery', label: 'Графический пак' },
  ]

  return (
    <header className="prototype-toolbar">
      <div className="prototype-toolbar__brand"><span>UX</span><div><b>СМЕНА</b><small>интерактивный прототип</small></div></div>
      <div className="prototype-toolbar__views" role="group" aria-label="Выбрать экран">
        {views.map((view) => <button type="button" className={role === view.role && screen === view.screen ? 'is-active' : ''} key={`${view.role}-${view.screen}`} onClick={() => onView(view.role, view.screen)}>{view.label}</button>)}
      </div>
      <label className="prototype-toolbar__select"><span>Экран прототипа</span><select aria-label="Выбрать экран прототипа" value={`${role}:${screen}`} onChange={(event) => { const [nextRole, nextScreen] = event.target.value.split(':'); onView(nextRole, nextScreen) }}>{views.map((view) => <option value={`${view.role}:${view.screen}`} key={`${view.role}-${view.screen}-option`}>{view.label}</option>)}</select><ChevronDown size={15} /></label>
      <div className="prototype-toolbar__controls">
        {role === 'worker' ? <button className="scenario-toggle" type="button" disabled={!['idle', 'finished'].includes(shiftPhase)} onClick={shiftPhase === 'finished' ? onResetDay : () => onBreakMode(breakMode === 'fixed' ? 'manual' : 'fixed')} aria-label={shiftPhase === 'finished' ? 'Сбросить демонстрационный рабочий день' : `Сменить демонстрационное правило обеда. Сейчас: ${breakMode === 'fixed' ? '12:00–12:45' : 'вручную'}`} title="Демо-сценарий рабочего дня">
          {shiftPhase === 'finished' ? <RotateCcw size={16} /> : <Coffee size={16} />}<span>{shiftPhase === 'finished' ? 'Повторить день' : breakMode === 'fixed' ? 'Обед 12:00–12:45' : 'Обед вручную'}</span>
        </button> : null}
        <button className={`network-toggle ${online ? '' : 'is-offline'}`} type="button" onClick={onToggleNetwork}>
          {online ? <Wifi size={17} /> : <CloudOff size={17} />}{online ? 'Сеть стабильна' : 'Плохая сеть'}
        </button>
      </div>
    </header>
  )
}

const presentationFlow = [
  { label: 'Объект', icon: Building2 },
  { label: 'Смена', icon: Clock3 },
  { label: 'Задача', icon: ClipboardList },
  { label: 'Результат', icon: TrendingUp },
  { label: 'Проверка', icon: ShieldCheck },
  { label: 'Табель', icon: CalendarDays },
  { label: 'Отчёт', icon: BarChart3 },
]

function PresentationDeck({ onOpenView, onOpenTask }) {
  const [slide, setSlide] = useState(0)
  const [taskDemo, setTaskDemo] = useState('simple')
  const totalSlides = 8

  const goTo = (next) => setSlide(Math.max(0, Math.min(totalSlides - 1, next)))

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') goTo(slide + 1)
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') goTo(slide - 1)
      if (event.key === 'Home') goTo(0)
      if (event.key === 'End') goTo(totalSlides - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [slide])

  const slides = [
    <section className="pitch-slide pitch-slide--hero" aria-labelledby="pitch-slide-1">
      <img className="pitch-hero__building" src="/graphics/backgrounds/object-business-3d-v2.webp" alt="Архитектурная модель строительного объекта" />
      <div className="pitch-hero__wash" aria-hidden="true" />
      <div className="pitch-hero__content">
        <span className="pitch-kicker">Интерактивная концепция · 2026</span>
        <h1 id="pitch-slide-1">Стройка работает<br />в одном ритме</h1>
        <p>«СМЕНА» объединяет людей, рабочее время, задачи и фактический результат — от объекта до проверяемого отчёта.</p>
        <div className="pitch-hero__actions"><button type="button" onClick={() => goTo(1)}>Посмотреть концепцию<ArrowRight size={18} /></button><button type="button" onClick={() => onOpenView('contractor', 'dashboard')}>Открыть живой прототип<ArrowUpRight size={17} /></button></div>
      </div>
      <div className="pitch-hero__status"><span><i />UX-прототип</span><b>Стадия 02</b><small>Проверяем ключевые сценарии трёх ролей</small></div>
      <div className="pitch-slide__number">01</div>
    </section>,

    <section className="pitch-slide pitch-slide--problem" aria-labelledby="pitch-slide-2">
      <div className="pitch-problem__copy">
        <span className="pitch-kicker">Исходная проблема</span>
        <h2 id="pitch-slide-2">Рабочий день есть.<br />Единой картины — нет.</h2>
        <p>Присутствие, поручения, объёмы и причины отставания живут в разных местах. Подрядчику приходится восстанавливать факты вручную.</p>
        <div className="pitch-quote"><AlertTriangle size={20} /><span>Главный вопрос остаётся без быстрого ответа:</span><b>кто сегодня работал, что сделал и кто это подтвердил?</b></div>
      </div>
      <div className="pitch-chaos" aria-label="Разрозненные источники рабочего дня">
        <article className="pitch-chaos__item pitch-chaos__item--one"><MessageCircle size={22} /><span>Чаты</span><small>договорённости и фото</small></article>
        <article className="pitch-chaos__item pitch-chaos__item--two"><FileText size={22} /><span>Бумага</span><small>смены и подписи</small></article>
        <article className="pitch-chaos__item pitch-chaos__item--three"><BarChart3 size={22} /><span>Таблицы</span><small>ручной сводный отчёт</small></article>
        <article className="pitch-chaos__item pitch-chaos__item--four"><Phone size={22} /><span>Звонки</span><small>уточнение фактов</small></article>
        <div className="pitch-chaos__center"><span>?</span><b>Что происходит<br />на объекте сейчас</b></div>
      </div>
      <div className="pitch-slide__number">02</div>
    </section>,

    <section className="pitch-slide pitch-slide--flow" aria-labelledby="pitch-slide-3">
      <header className="pitch-slide__heading"><span className="pitch-kicker">Продуктовая основа</span><h2 id="pitch-slide-3">Каждый факт связан с рабочим процессом</h2><p>Система не собирает разрозненные отметки — она сохраняет понятную цепочку от объекта до отчёта.</p></header>
      <div className="pitch-flow" aria-label="Рабочая цепочка продукта">
        {presentationFlow.map(({ label, icon: Icon }, index) => <div className="pitch-flow__step" key={label}><span><Icon size={24} /></span><b>{label}</b><small>{String(index + 1).padStart(2, '0')}</small>{index < presentationFlow.length - 1 ? <i><ArrowRight size={16} /></i> : null}</div>)}
      </div>
      <div className="pitch-flow__meaning"><Route size={25} /><div><b>Историю можно проверить в обратную сторону</b><span>Из отчёта — к дню, смене, задаче, результату и автору каждого изменения.</span></div></div>
      <div className="pitch-slide__number">03</div>
    </section>,

    <section className="pitch-slide pitch-slide--roles" aria-labelledby="pitch-slide-4">
      <header className="pitch-slide__heading pitch-slide__heading--light"><span className="pitch-kicker">Три роли · одна система</span><h2 id="pitch-slide-4">Каждый видит ровно то, что нужно ему</h2><p>Общие данные и правила остаются едиными, а интерфейс подстраивается под реальную рабочую роль.</p></header>
      <div className="pitch-roles">
        <article className="pitch-role pitch-role--contractor"><div className="pitch-role__visual"><img src="/graphics/backgrounds/metric-workforce-3d.webp" alt="Обзор строительной команды" /><span><LayoutDashboard size={24} /></span></div><div className="pitch-role__copy"><small>Управление</small><h3>Подрядчик</h3><p>Видит объекты, людей, задачи, отклонения и отчёты на компьютере и телефоне.</p><button type="button" onClick={() => onOpenView('contractor', 'dashboard')}>Открыть кабинет<ArrowUpRight size={16} /></button></div></article>
        <article className="pitch-role pitch-role--foreman"><div className="pitch-role__visual"><img src="/graphics/backgrounds/object-school-3d-v2.webp" alt="Строительный объект бригадира" /><span><HardHat size={24} /></span></div><div className="pitch-role__copy"><small>Оперативный контроль</small><h3>Бригадир</h3><p>Следит за командой, уточняет задания, решает проблемы и проверяет результат.</p><button type="button" onClick={() => onOpenView('foreman', 'team')}>Открыть PWA<ArrowUpRight size={16} /></button></div></article>
        <article className="pitch-role pitch-role--worker"><div className="pitch-role__visual"><img src="/graphics/backgrounds/object-residential-3d-v2.webp" alt="Рабочая зона сотрудника" /><span><UserRound size={24} /></span></div><div className="pitch-role__copy"><small>Работа на объекте</small><h3>Рабочий</h3><p>Отмечает смену, видит задачи, вносит результат и сообщает о препятствиях.</p><button type="button" onClick={() => onOpenView('worker', 'home')}>Открыть PWA<ArrowUpRight size={16} /></button></div></article>
      </div>
      <div className="pitch-slide__number">04</div>
    </section>,

    <section className="pitch-slide pitch-slide--ready" aria-labelledby="pitch-slide-5">
      <div className="pitch-ready__copy"><span className="pitch-kicker">Что готово сейчас</span><h2 id="pitch-slide-5">Концепцию уже можно пройти руками</h2><p>Это не набор статичных картинок. Основные оболочки, переходы и формы собраны в едином интерактивном React‑прототипе.</p>
        <div className="pitch-ready__list"><span><CheckCircle2 size={17} /><b>Адаптивный кабинет подрядчика</b><small>Desktop и mobile-композиции</small></span><span><CheckCircle2 size={17} /><b>Mobile-first PWA двух ролей</b><small>Рабочий и бригадир</small></span><span><CheckCircle2 size={17} /><b>Оперативная сводка</b><small>Объекты, люди, задачи и внимание</small></span><span><CheckCircle2 size={17} /><b>Универсальная задача</b><small>Простая, объёмная и составная</small></span><span><CheckCircle2 size={17} /><b>Честные состояния сети</b><small>Online, локальное сохранение, проверка</small></span></div>
      </div>
      <div className="pitch-ready__stage">
        <div className="pitch-device pitch-device--desktop"><div className="pitch-device__bar"><i /><i /><i /><span>СМЕНА · Подрядчик</span></div><img src="/graphics/backgrounds/object-business-3d-v2.webp" alt="Фрагмент desktop-интерфейса подрядчика" /><div><b>42</b><span>человека на объектах</span><em>5 событий требуют решения</em></div></div>
        <div className="pitch-device pitch-device--phone"><div className="pitch-device__notch" /><img src="/graphics/svg/worker-hardhat.svg" alt="Иллюстрация рабочего" /><span>Смена начата</span><b>Укладка плитки</b><small>96 из 150 м²</small></div>
        <button type="button" className="pitch-live-button" onClick={() => onOpenView('contractor', 'dashboard')}><Play size={17} fill="currentColor" />Запустить демонстрацию</button>
      </div>
      <div className="pitch-slide__number">05</div>
    </section>,

    <section className="pitch-slide pitch-slide--task" aria-labelledby="pitch-slide-6">
      <div className="pitch-task__copy"><span className="pitch-kicker">Ключевой UX-принцип</span><h2 id="pitch-slide-6">Одна форма — от поручения до этапной работы</h2><p>Пользователь не выбирает технический тип. Задача становится объёмной или составной только после добавления нужных параметров.</p>
        <div className="pitch-task__selector" role="group" aria-label="Режим демонстрации задачи"><button type="button" className={taskDemo === 'simple' ? 'is-active' : ''} onClick={() => setTaskDemo('simple')}>Простая</button><button type="button" className={taskDemo === 'volume' ? 'is-active' : ''} onClick={() => setTaskDemo('volume')}>+ Объём</button><button type="button" className={taskDemo === 'stages' ? 'is-active' : ''} onClick={() => setTaskDemo('stages')}>+ Этапы</button></div>
        <button className="pitch-task__open" type="button" onClick={onOpenTask}>Открыть полную форму<ArrowUpRight size={16} /></button>
      </div>
      <div className={`pitch-task__demo pitch-task__demo--${taskDemo}`}>
        <header><span>Новая задача</span><b>{taskDemo === 'simple' ? 'Простая задача' : taskDemo === 'volume' ? 'Объёмная задача' : 'Составная задача'}</b><small>Определено системой</small></header>
        <label><span>Что сделать</span><strong>Подготовить основание</strong></label>
        <div className="pitch-task__people"><Avatar initials="ИИ" tone="blue" /><span><b>Иванов И.И.</b><small>Ответственный автоматически</small></span><CheckCircle2 size={18} /></div>
        {taskDemo !== 'simple' ? <div className="pitch-task__volume"><span><small>Общий объём</small><b>500 м²</b></span><span><small>План сегодня</small><b>120 м²</b></span></div> : <div className="pitch-task__simple"><Check size={20} /><span><b>Результат: «Готово»</b><small>Проверка необязательна</small></span></div>}
        {taskDemo === 'stages' ? <div className="pitch-task__stages"><span><i>01</i>Подготовить основание<Check size={15} /></span><span><i>02</i>Выполнить основную работу<em>120 м²</em></span><span><i>03</i>Сдать фотоотчёт</span></div> : null}
        <footer><ShieldCheck size={17} /><span>{taskDemo === 'simple' ? 'Можно закрыть без проверки' : 'Результат отправится на проверку'}</span></footer>
      </div>
      <div className="pitch-slide__number">06</div>
    </section>,

    <section className="pitch-slide pitch-slide--scope" aria-labelledby="pitch-slide-7">
      <header className="pitch-slide__heading"><span className="pitch-kicker">Честный статус проекта</span><h2 id="pitch-slide-7">Сначала проверяем работу людей. Затем строим инфраструктуру.</h2><p>Прототип уже отвечает на вопрос «как пользоваться». Production‑этап ответит на вопрос «как надёжно хранить и обрабатывать реальные данные».</p></header>
      <div className="pitch-scope">
        <article className="pitch-scope__card pitch-scope__card--ready"><header><MonitorSmartphone size={22} /><span><small>Готово сейчас</small><b>Интерактивный UX-прототип</b></span></header><ul><li>Три ролевые оболочки</li><li>Адаптивные ключевые экраны</li><li>Живые формы и переходы</li><li>Зафиксированные бизнес-правила</li><li>Документация продукта и MVP</li></ul><footer><CheckCircle2 size={17} />Можно показывать и проверять сценарии</footer></article>
        <div className="pitch-scope__bridge"><ArrowRight size={22} /><span>После утверждения UX</span><b>G2</b></div>
        <article className="pitch-scope__card pitch-scope__card--next"><header><Database size={22} /><span><small>Следующий слой</small><b>Production-фундамент</b></span></header><ul><li>Backend и REST/WebSocket API</li><li>PostgreSQL и миграции</li><li>Авторизация и реальные права</li><li>IndexedDB и offline-sync</li><li>Окружения, CI и наблюдаемость</li></ul><footer><Route size={17} />Начинается только после прохождения G2</footer></article>
      </div>
      <div className="pitch-slide__number">07</div>
    </section>,

    <section className="pitch-slide pitch-slide--final" aria-labelledby="pitch-slide-8">
      <img src="/graphics/backgrounds/object-residential-3d-v2.webp" alt="Архитектурная модель объекта" />
      <div className="pitch-final__veil" aria-hidden="true" />
      <div className="pitch-final__content"><span className="pitch-kicker">Следующий контрольный рубеж</span><h2 id="pitch-slide-8">Утвердить ключевые сценарии и перейти к инженерному фундаменту</h2><p>До G2 мы завершаем полный рабочий день, паспорт задачи и UX‑проверку с пилотным подрядчиком. После этого начинается production‑реализация утверждённого продукта.</p>
        <div className="pitch-final__steps"><span><i>01</i><b>Довести UX</b><small>Смена, обед, итог дня и паспорт задачи</small></span><span><i>02</i><b>Проверить на практике</b><small>Показать сценарии пилотному подрядчику</small></span><span><i>03</i><b>Пройти G2</b><small>Зафиксировать критические замечания</small></span></div>
        <div className="pitch-final__actions"><button type="button" onClick={() => onOpenView('contractor', 'dashboard')}>Перейти к прототипу<Play size={17} fill="currentColor" /></button><button type="button" onClick={() => goTo(0)}>Начать сначала</button></div>
      </div>
      <div className="pitch-slide__number">08</div>
    </section>,
  ]

  return (
    <section className="presentation-deck" aria-label="Интерактивная презентация проекта СМЕНА">
      <div className="presentation-deck__frame" key={slide}>{slides[slide]}</div>
      <footer className="presentation-controls">
        <div className="presentation-controls__brand"><Brand compact /><span>Презентация проекта</span></div>
        <div className="presentation-controls__dots" role="group" aria-label="Слайды презентации">{Array.from({ length: totalSlides }, (_, index) => <button type="button" className={slide === index ? 'is-active' : ''} onClick={() => goTo(index)} aria-label={`Слайд ${index + 1}`} aria-current={slide === index ? 'step' : undefined} key={index}><span /></button>)}</div>
        <div className="presentation-controls__nav"><span>{String(slide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}</span><button type="button" aria-label="Предыдущий слайд" onClick={() => goTo(slide - 1)} disabled={slide === 0}><ChevronLeft size={19} /></button><button type="button" aria-label="Следующий слайд" onClick={() => goTo(slide + 1)} disabled={slide === totalSlides - 1}><ChevronRight size={19} /></button></div>
      </footer>
    </section>
  )
}

const graphicAssets = [
  { file: 'brand-mark.svg', name: 'Фирменный знак', category: 'Иконка', mode: 'light' },
  { file: 'tile-module.svg', name: 'Плиточный модуль', category: 'Иконка работ', mode: 'light' },
  { file: 'worker-hardhat.svg', name: 'Рабочий в каске', category: 'Иллюстрация', mode: 'light' },
  { file: 'construction-crane.svg', name: 'Башенный кран', category: 'Hero-графика', mode: 'dark', wide: true },
  { file: 'blueprint-grid.svg', name: 'Чертёжная сетка', category: 'Прозрачный оверлей', mode: 'light', wide: true },
  { file: 'aurora-ribbons.svg', name: 'Градиентные ленты', category: 'Прозрачный оверлей', mode: 'dark', wide: true },
  { file: 'site-silhouette.svg', name: 'Силуэт стройплощадки', category: 'Фоновый оверлей', mode: 'light', wide: true },
  { file: 'safety-contour.svg', name: 'Сигнальный контур', category: 'Декоративный шейп', mode: 'dark', wide: true },
  { file: 'metric-orbit.svg', name: 'Орбитальный индикатор', category: 'Data-шейп', mode: 'light' },
  { file: 'empty-state-team.svg', name: 'Команда', category: 'Empty state', mode: 'light' },
]

function GraphicsShowcase() {
  return (
    <section className="graphics-showcase" aria-labelledby="graphics-title">
      <header className="graphics-showcase__header">
        <div>
          <span>SMENA / GRAPHICS 01</span>
          <h1 id="graphics-title">Графика строительной системы</h1>
          <p>10 масштабируемых SVG-активов. У каждого прозрачный холст — сетка под изображением показывает настоящий alpha-канал.</p>
        </div>
        <div className="alpha-proof"><CheckCircle2 size={19} /><span><b>TRUE ALPHA</b><small>без фонового слоя</small></span></div>
      </header>
      <div className="graphics-grid">
        {graphicAssets.map((asset) => (
          <article className={`asset-card ${asset.wide ? 'asset-card--wide' : ''}`} key={asset.file}>
            <div className={`asset-card__preview asset-card__preview--${asset.mode}`}>
              <img src={`/graphics/svg/${asset.file}`} alt={asset.name} />
            </div>
            <footer>
              <div className="asset-card__meta"><span>{asset.category}</span><strong>{asset.name}</strong></div>
              <div className="asset-card__downloads">
                <a href={`/graphics/svg/${asset.file}`} download={asset.file} aria-label={`Скачать ${asset.name} в SVG`}>SVG <ChevronRight size={15} /></a>
                <a href={`/graphics/png/${asset.file.replace('.svg', '.png')}`} download={asset.file.replace('.svg', '.png')} aria-label={`Скачать ${asset.name} в PNG`}>PNG <ChevronRight size={15} /></a>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const narrowViewport = useMediaQuery('(max-width: 767px)')
  const [role, setRole] = useState('contractor')
  const [screen, setScreen] = useState('dashboard')
  const [online, setOnline] = useState(true)
  const [queued, setQueued] = useState(0)
  const [shiftPhase, setShiftPhase] = useState('idle')
  const [breakMode, setBreakMode] = useState('fixed')
  const [breakCompleted, setBreakCompleted] = useState(false)
  const [taskExample, setTaskExample] = useState('volume')
  const [taskPerspective, setTaskPerspective] = useState('worker')
  const [problemContext, setProblemContext] = useState('general')
  const [issueStatus, setIssueStatus] = useState('open')
  const [issuePerspective, setIssuePerspective] = useState('worker')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')

  const currentLabel = useMemo(() => `${role}-${screen}`, [role, screen])

  const notify = (message) => {
    if (!message) return
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
    navigator.vibrate?.(12)
  }

  const switchView = (nextRole, nextScreen) => {
    if (nextRole === 'worker' && nextScreen === 'task') {
      setTaskExample('volume')
      setTaskPerspective('worker')
    }
    setRole(nextRole)
    setScreen(nextScreen)
    setSheet(null)
  }

  const openWorkerTask = (example = 'volume') => {
    setTaskExample(example)
    setTaskPerspective('worker')
    setScreen('task')
  }

  const openForemanReview = () => {
    setTaskExample('volume')
    setTaskPerspective('foreman')
    setScreen('task')
  }

  const openProblem = (context = 'general') => {
    setProblemContext(context)
    setSheet('problem')
  }

  const openIssue = (perspective = role) => {
    setIssuePerspective(perspective)
    setSheet('issue-detail')
  }

  const navigate = (key) => {
    if (role === 'worker' && key === 'home') return setScreen('home')
    if (role === 'worker' && key === 'task') return setScreen('tasks')
    if (role === 'worker' && key === 'day') return setScreen('day')
    if (role === 'worker' && key === 'messages') return notify('Сообщения откроются в разделе активности')
    if (role === 'worker' && key === 'profile') return notify('Профиль работника — отдельный экран следующего UX-цикла')
    if (role === 'foreman' && key === 'today') return setScreen('attention')
    if (role === 'foreman' && key === 'team') return setScreen('team')
    if (role === 'foreman' && key === 'tasks') return notify('Общий список задач бригадира — следующий экран; проверки доступны в «Сегодня»')
    if (role === 'foreman' && key === 'team-list') return notify('Полный состав команды — следующий экран; текущие работники показаны ниже')
    if (role === 'foreman' && key === 'worker') return notify('Карточка работника — следующий экран UX-цикла')
    if (role === 'foreman' && key === 'messages') return notify('Сообщения откроются в разделе активности')
    if (role === 'foreman' && key === 'more') return notify('Настройки объекта и дополнительные разделы появятся на следующем этапе')
    notify('Этот раздел появится на следующем этапе')
  }

  const startShift = () => {
    setShiftPhase('active')
    setBreakCompleted(false)
    if (!online) setQueued((value) => value + 1)
    notify(online ? 'Смена начата в 07:54' : 'Смена начата · сохранено на телефоне')
  }

  const startBreak = () => {
    setShiftPhase('break')
    if (!online) setQueued((value) => value + 1)
    notify(online ? 'Обед начат в 12:15' : 'Обед начат · сохранено на телефоне')
  }

  const finishBreak = () => {
    setShiftPhase('active')
    setBreakCompleted(true)
    if (!online) setQueued((value) => value + 1)
    notify(online ? 'Работа продолжена в 13:00' : 'Окончание обеда сохранено на телефоне')
  }

  const finishShift = () => {
    setShiftPhase('finished')
    setSheet(null)
    if (!online) setQueued((value) => value + 1)
    notify(online ? 'Смена завершена · 9 ч 21 мин' : 'Смена завершена · сохранено на телефоне')
  }

  const selectBreakMode = (mode) => {
    if (shiftPhase !== 'idle' && shiftPhase !== 'finished') return notify('Правило обеда уже применено к текущей смене')
    if (shiftPhase === 'finished') setShiftPhase('idle')
    setBreakCompleted(false)
    setBreakMode(mode)
    notify(mode === 'fixed' ? 'Сценарий: фиксированный обед' : 'Сценарий: ручной обед')
  }

  const resetWorkday = () => {
    setShiftPhase('idle')
    setBreakCompleted(false)
    setSheet(null)
    notify('Сценарий рабочего дня сброшен')
  }

  const toggleNetwork = () => {
    const nextOnline = !online
    setOnline(nextOnline)
    if (nextOnline && queued > 0) {
      notify(`${queued} действия синхронизированы`)
      setQueued(0)
    } else if (!nextOnline) {
      notify('Включена имитация плохой сети')
    }
  }

  const completeSheet = (message) => {
    setSheet(null)
    if (!online && message) setQueued((value) => value + 1)
    notify(message || 'Готово')
  }

  const transitionIssue = (nextStatus, message) => {
    if (!online) return notify('Изменение статуса требует подключения')
    setIssueStatus(nextStatus)
    notify(message)
  }

  const openTaskFromPresentation = () => {
    setRole('contractor')
    setScreen('dashboard')
    setSheet('create')
  }

  const renderedScreen = {
    'worker-home': <WorkerHome shiftPhase={shiftPhase} breakMode={breakMode} breakCompleted={breakCompleted} online={online} queued={queued} onStartShift={startShift} onStartBreak={startBreak} onFinishBreak={finishBreak} onFinishShift={() => setSheet('shift-summary')} onTask={openWorkerTask} onProblem={() => openProblem('general')} onNotifications={() => setSheet('notifications')} onNavigate={navigate} />,
    'worker-tasks': <WorkerTasks online={online} queued={queued} onTask={openWorkerTask} onNotifications={() => setSheet('notifications')} onNavigate={navigate} />,
    'worker-day': <WorkerDay shiftPhase={shiftPhase} breakMode={breakMode} breakCompleted={breakCompleted} online={online} queued={queued} onBack={() => setScreen('home')} onTask={openWorkerTask} onNotifications={() => setSheet('notifications')} onNavigate={navigate} />,
    'worker-task': <WorkerTask initialExample={taskExample} initialPerspective={taskPerspective} online={online} queued={queued} onBack={() => setScreen('tasks')} onProblem={() => openProblem(taskExample)} onIssue={() => openIssue('worker')} onSubmit={(kind = 'volume') => setSheet(`result-${kind}`)} onNotify={notify} />,
    'foreman-team': <ForemanTeam online={online} onCreateTask={() => setSheet('create')} onNotifications={() => setSheet('notifications')} onNavigate={navigate} />,
    'foreman-attention': <ForemanAttention onReview={openForemanReview} onIssue={() => openIssue('foreman')} onContact={() => notify('Открываем связь с Ивановым И.И.')} onNotifications={() => setSheet('notifications')} onNavigate={navigate} />,
    'foreman-task': <WorkerTask initialExample={taskExample} initialPerspective={taskPerspective} online={online} queued={queued} onBack={() => setScreen('attention')} onProblem={() => openProblem(taskExample)} onIssue={() => openIssue('foreman')} onSubmit={(kind = 'volume') => setSheet(`result-${kind}`)} onNotify={notify} />,
  }[currentLabel]

  const contractorMode = screen === 'dashboard-mobile' || narrowViewport ? 'mobile' : 'desktop'

  return (
    <main className="prototype-stage">
      <PrototypeToolbar role={role} screen={screen} online={online} breakMode={breakMode} shiftPhase={shiftPhase} onView={switchView} onToggleNetwork={toggleNetwork} onBreakMode={selectBreakMode} onResetDay={resetWorkday} />
      <div className="blueprint-grid" aria-hidden="true" />
      <div className="stage-orb stage-orb--one" aria-hidden="true" />
      <div className="stage-orb stage-orb--two" aria-hidden="true" />

      {role === 'presentation' ? <PresentationDeck onOpenView={switchView} onOpenTask={openTaskFromPresentation} /> : role === 'assets' ? <GraphicsShowcase /> : role === 'contractor' ? <section className={`contractor-preview contractor-preview--${contractorMode}`} aria-label="Предпросмотр адаптивного кабинета подрядчика">
        <ContractorDashboard mode={contractorMode} onCreateTask={() => setSheet('create')} onNotifications={() => setSheet('notifications')} onOpenIssue={() => openIssue('contractor')} onNotify={notify} />
        {sheet ? <Sheet type={sheet} online={online} problemContext={problemContext} issueStatus={issueStatus} issuePerspective={issuePerspective} onIssueTransition={transitionIssue} onClose={() => setSheet(null)} onComplete={completeSheet} /> : null}
        <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite"><CheckCircle2 size={18} /><span>{toast}</span></div>
      </section> : <section className="device-wrap" aria-label="Предпросмотр мобильного приложения">
        <div className="device-side-note device-side-note--left"><span>01</span><b>{role === 'worker' ? 'Рабочий' : 'Бригадир'}</b><small>Роль пользователя</small></div>
        <div className="phone-frame" key={currentLabel}>
          {renderedScreen}
          {sheet === 'shift-summary' ? <ShiftSummarySheet breakMode={breakMode} online={online} onClose={() => setSheet(null)} onFinish={finishShift} /> : sheet ? <Sheet type={sheet} online={online} problemContext={problemContext} issueStatus={issueStatus} issuePerspective={issuePerspective} onIssueTransition={transitionIssue} onClose={() => setSheet(null)} onComplete={completeSheet} /> : null}
          <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite"><CheckCircle2 size={18} /><span>{toast}</span></div>
        </div>
        <div className="device-side-note device-side-note--right"><span>02</span><b>{online ? 'Online' : 'Offline-first'}</b><small>{online ? 'Связь с сервером' : queued > 0 ? `${queued} сохранено локально` : 'Работа без сети'}</small></div>
      </section>}
    </main>
  )
}
