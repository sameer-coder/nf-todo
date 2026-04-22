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
        'bg-paper-surface border border-paper-border rounded-sm px-4 py-3',
        'text-sm text-paper-text shadow-paper',
        'motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in',
      )}
    >
      {message}
    </div>
  )
}
