import { cn } from '../utils/cn'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
}

export function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label="Mark complete"
      onClick={onChange}
      className={cn(
        'w-11 h-11 flex items-center justify-center flex-shrink-0',
        'focus-visible:ring-2 focus-visible:ring-paper-ink focus-visible:ring-offset-2 rounded',
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
          'motion-safe:transition-colors motion-safe:duration-200',
          checked
            ? 'bg-paper-ink border-paper-ink'
            : 'bg-transparent border-paper-border',
        )}
      >
        {checked && (
          <svg
            key="checked"
            className="w-3 h-3 text-white motion-safe:animate-check-pop"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
