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
        'w-10 h-10 flex items-center justify-center flex-shrink-0',
        'rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2',
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-md border-2',
          'motion-safe:transition-all motion-safe:duration-200',
          checked
            ? 'bg-accent-gradient border-transparent shadow-sm shadow-accent-500/40'
            : 'bg-white border-paper-border hover:border-accent-400 hover:bg-accent-50/60',
        )}
      >
        {checked && (
          <svg
            key="checked"
            className="h-3 w-3 text-white motion-safe:animate-check-pop"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
