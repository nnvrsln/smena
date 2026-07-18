import type { MeContextResponse, Role } from '@smena/contracts'
import { useEffect, useState } from 'react'
import { loadMeContext } from '../api/context'

type ContextState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: MeContextResponse; error: null }
  | { status: 'error'; data: null; error: string }

export function useMeContext(role: Role): ContextState {
  const [state, setState] = useState<ContextState>({ status: 'loading', data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })
    loadMeContext(role, controller.signal)
      .then((data) => setState({ status: 'ready', data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', data: null, error: error instanceof Error ? error.message : 'Не удалось загрузить контекст' })
      })
    return () => controller.abort()
  }, [role])

  return state
}
