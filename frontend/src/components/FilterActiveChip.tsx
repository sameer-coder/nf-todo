interface FilterActiveChipProps {
  label: string
  onRemove: () => void
}

export function FilterActiveChip({ label, onRemove }: FilterActiveChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-gradient px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm shadow-accent-500/30">
      {label}
      <button
        type="button"
        aria-label={`Remove filter ${label}`}
        onClick={onRemove}
        className="-mr-1 rounded-full p-0.5 text-white/80 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span aria-hidden="true" className="text-xs leading-none">×</span>
      </button>
    </span>
  )
}
