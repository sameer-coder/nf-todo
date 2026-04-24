interface EmptyStateProps {
  variant: 'empty' | 'no-results'
  onClearFilters?: () => void
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-paper-border bg-paper-header/60 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-500">
        {variant === 'empty' ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        )}
      </div>
      {variant === 'empty' ? (
        <>
          <p className="text-sm font-medium text-paper-text">No todos yet.</p>
          <p className="mt-1 text-xs text-paper-muted">Type above and press Enter to add one.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-paper-text">No todos match your filters.</p>
          <button
            onClick={onClearFilters}
            className="mt-3 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  )
}
