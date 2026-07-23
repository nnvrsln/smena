import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { logout } from './api/context'
import { LoginScreen } from './components/LoginScreen'
import { InvitationScreen } from './components/InvitationScreen'
import { RoleWorkspace } from './components/RoleWorkspace'
import { useMeContext } from './hooks/useMeContext'

export default function App() {
  const [reloadKey, setReloadKey] = useState(0)
  const context = useMeContext(reloadKey)
  const invitationToken = window.location.pathname.match(/^\/invite\/([^/]+)$/u)?.[1]

  async function signOut() {
    await logout().catch(() => undefined)
    setReloadKey((value) => value + 1)
  }

  if (invitationToken) return <InvitationScreen token={invitationToken} onComplete={() => setReloadKey((value) => value + 1)} />
  if (context.status === 'unauthenticated') return <LoginScreen onSuccess={() => setReloadKey((value) => value + 1)} />
  if (context.status === 'loading') return <div className="production-stage"><StateCard icon={<LoaderCircle className="spin" />} title="Открываем кабинет" body="Загружаем актуальные данные." /></div>
  if (context.status === 'error') return <div className="production-stage"><StateCard icon={<AlertTriangle />} title="Не удалось подключиться" body={context.error} /></div>
  return <div className="production-stage production-stage--workspace"><RoleWorkspace context={context.data} onLogout={signOut} /></div>
}

function StateCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <main className="state-screen"><section><span>{icon}</span><h1>{title}</h1><p>{body}</p><code>npm run dev</code></section></main>
}
