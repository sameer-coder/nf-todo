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
        'rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full border-2',
          'motion-safe:transition-colors motion-safe:duration-200',
          checked
            ? 'bg-indigo-600 border-indigo-600'
            : 'bg-transparent border-paper-border shadow-[inset_0_1px_1px_rgba(23,32,27,0.06)]',
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
