import { AlertTriangle, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { requestedDevelopmentRole } from './api/context'
import { RoleDevBar } from './components/RoleDevBar'
import { RoleWorkspace } from './components/RoleWorkspace'
import { useMeContext } from './hooks/useMeContext'

export default function App() {
  const role = requestedDevelopmentRole()
  const context = useMeContext(role)

  return <div className="production-stage"><RoleDevBar activeRole={role} />{context.status === 'loading' ? <StateCard icon={<LoaderCircle className="spin" />} title="Загружаем контекст доступа" body="Web-клиент ждёт подтверждённые данные от API." /> : context.status === 'error' ? <StateCard icon={<AlertTriangle />} title="API недоступен" body={context.error} /> : <RoleWorkspace context={context.data} />}</div>
}

function StateCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <main className="state-screen"><section><span>{icon}</span><h1>{title}</h1><p>{body}</p><code>npm run dev</code></section></main>
}
