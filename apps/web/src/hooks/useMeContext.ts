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
    setState({ status: 'loading', data: null, error: null })
    loadMeContext(controller.signal)
      .then((data) => setState({ status: 'ready', data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiRequestError && error.status === 401) {
          setState({ status: 'unauthenticated', data: null, error: null })
          return
        }
        setState({ status: 'error', data: null, error: error instanceof Error ? error.message : 'Не удалось загрузить контекст' })
      })
    return () => controller.abort()
  }, [reloadKey])

  return state
}
