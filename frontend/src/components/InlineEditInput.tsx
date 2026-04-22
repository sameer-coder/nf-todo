import { useRef, useEffect, useState } from 'react'

interface InlineEditInputProps {
  initialValue: string
  onSave: (newTitle: string) => void
  onCancel: () => void
}

export function InlineEditInput({ initialValue, onSave, onCancel }: InlineEditInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const trimmed = value.trim()
      if (trimmed) onSave(trimmed)
      else onCancel()
    } else if (e.key === 'Escape') {
      cancelledRef.current = true
      onCancel()
    }
  }

  function handleBlur() {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    const trimmed = value.trim()
    if (trimmed) onSave(trimmed)
    else onCancel()
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="w-full bg-transparent outline-none focus:ring-1 focus:ring-paper-ink/40 rounded px-1 text-[15px] text-paper-text"
    />
  )
}
