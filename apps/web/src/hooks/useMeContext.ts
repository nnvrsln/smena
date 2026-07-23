import type { MeContextResponse } from '@smena/contracts'
import { useEffect, useState } from 'react'
import { ApiRequestError, loadMeContext } from '../api/context'

type ContextState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: MeContextResponse; error: null }
  | { status: 'unauthenticated'; data: null; error: null }
  | { status: 'error'; data: null; error: string }

export function useMeContext(reloadKey: number): ContextState {
  const [state, setState] = useState<ContextState>({ status: 'loading', data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState({ status: 'loading', data: null, error: null })
    const refresh = async (initial: boolean) => {
      try {
        const data = await loadMeContext(controller.signal)
        if (active) setState({ status: 'ready', data, error: null })
      } catch (error: unknown) {
        if (!active || controller.signal.aborted || !initial) return
        if (error instanceof ApiRequestError && error.status === 401) {
          setState({ status: 'unauthenticated', data: null, error: null })
          return
        }
        setState({ status: 'error', data: null, error: error instanceof Error ? error.message : 'Не удалось загрузить контекст' })
      }
    }
    void refresh(true)
    const timer = window.setInterval(() => void refresh(false), 5000)
    return () => { active = false; window.clearInterval(timer); controller.abort() }
  }, [reloadKey])

  return state
}
