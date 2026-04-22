interface EmptyStateProps {
  variant: 'empty' | 'no-results'
  onClearFilters?: () => void
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-paper-border bg-paper-header/60 px-6 py-16 text-center text-sm text-paper-muted">
      {variant === 'empty' ? (
        <p>No todos yet.</p>
      ) : (
        <>
          <p>No todos match your filters.</p>
          <button
            onClick={onClearFilters}
            className="mt-3 rounded-full px-3 py-1 text-paper-ink underline decoration-paper-ink/40 underline-offset-4 hover:text-paper-pencil focus-visible:ring-2 focus-visible:ring-paper-ink"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  )
}
