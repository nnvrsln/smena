import type { Role } from '@smena/contracts'

const roleLinks: Array<{ role: Role; label: string }> = [
  { role: 'contractor', label: 'Подрядчик' },
  { role: 'foreman', label: 'Бригадир' },
  { role: 'worker', label: 'Рабочий' },
]

export function RoleDevBar({ activeRole }: { activeRole: Role }) {
  if (!import.meta.env.DEV) return null
  return (
    <aside className="dev-role-bar" aria-label="Development identity">
      <span><b>DEV</b> Проверка доступа</span>
      <nav>{roleLinks.map(({ role, label }) => <a className={role === activeRole ? 'is-active' : ''} href={`?as=${role}`} key={role}>{label}</a>)}</nav>
    </aside>
  )
}
