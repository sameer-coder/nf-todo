interface EmptyStateProps {
  variant: 'empty' | 'no-results'
  onClearFilters?: () => void
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-paper-muted text-sm">
      {variant === 'empty' ? (
        <p>No todos yet.</p>
      ) : (
        <>
          <p>No todos match your filters.</p>
          <button
            onClick={onClearFilters}
            className="mt-2 text-paper-ink hover:text-paper-pencil underline focus-visible:ring-2 focus-visible:ring-paper-ink rounded"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  )
}
