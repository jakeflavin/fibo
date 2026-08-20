import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { ToastNote, ToastStack } from './Toast.styled'

interface Toast {
  id: number
  message: string
  kind: 'info' | 'error'
}

type PushToast = (message: string, kind?: Toast['kind']) => void

const ToastContext = createContext<PushToast>(() => {})

/** Push transient toasts (info by default, or 'error'). */
export function useToast(): PushToast {
  return useContext(ToastContext)
}

/** Renders the toast stack and provides `useToast` to the tree below. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback<PushToast>((message, kind = 'info') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <ToastStack  role="status" aria-live="polite">
        {toasts.map((t) => (
          <ToastNote key={t.id} $error={t.kind === 'error'}>
            {t.message}
          </ToastNote>
        ))}
      </ToastStack>
    </ToastContext.Provider>
  )
}
