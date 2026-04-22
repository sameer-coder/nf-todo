import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { cn } from '../utils/cn'

interface DragHandleProps {
  listeners?: DraggableSyntheticListeners
}

export function DragHandle({ listeners }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className={cn(
        'w-11 h-full flex items-center justify-center flex-shrink-0',
        'text-neutral-400 cursor-grab active:cursor-grabbing',
        'opacity-0 group-hover:opacity-100 motion-safe:transition-opacity',
        '[@media(pointer:coarse)]:opacity-40',
      )}
      {...listeners}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </button>
  )
}
