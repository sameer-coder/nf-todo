/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastState {
  message: string | null
}

interface ToastContextValue {
  toast: ToastState
  showToast: (message: string) => void
  clearToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: null })

  const showToast = useCallback((message: string) => {
    setToast({ message })
  }, [])

  const clearToast = useCallback(() => {
    setToast({ message: null })
  }, [])

  return (
    <ToastContext.Provider value={{ toast, showToast, clearToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
