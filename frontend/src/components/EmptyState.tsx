interface EmptyStateProps {
  variant: 'empty' | 'no-results'
  onClearFilters?: () => void
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-400 text-sm">
      {variant === 'empty' ? (
        <p>No todos yet.</p>
      ) : (
        <>
          <p>No todos match your filters.</p>
          <button
            onClick={onClearFilters}
            className="mt-2 text-indigo-600 hover:text-indigo-800 underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  )
}
