import { useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { cn } from '../utils/cn'

export function Toast() {
  const { toast: { message }, clearToast } = useToast()

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(clearToast, 4000)
    return () => clearTimeout(timer)
  }, [message, clearToast])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-2 rounded-xl border border-paper-border bg-white/95 px-4 py-3 backdrop-blur-sm',
        'text-sm font-medium text-paper-text shadow-soft',
        'motion-safe:animate-fade-in-up',
      )}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
      {message}
    </div>
  )
}
