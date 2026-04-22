interface FilterActiveChipProps {
  label: string
  onRemove: () => void
}

export function FilterActiveChip({ label, onRemove }: FilterActiveChipProps) {
  return (
    <span className="bg-paper-ink/10 text-paper-ink ring-1 ring-paper-ink/30 font-semibold rounded-full px-2.5 py-0.5 text-xs inline-flex items-center gap-1">
      {label}
      <button
        type="button"
        aria-label={`Remove filter ${label}`}
        onClick={onRemove}
        className="p-1 -mr-1 hover:text-paper-pencil focus-visible:ring-2 focus-visible:ring-paper-ink focus-visible:ring-offset-2 rounded-full"
      >
        <span aria-hidden="true">×</span>
      </button>
    </span>
  )
}
