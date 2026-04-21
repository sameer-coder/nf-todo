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
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded',
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center',
          checked
            ? 'bg-indigo-600 border-indigo-600'
            : 'bg-white border-neutral-300',
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
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
