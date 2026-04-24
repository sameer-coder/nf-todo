import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TodoProvider, useTodos } from './context/TodoContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { fetchTodos } from './api/todos'
import { AddTodoInput } from './components/AddTodoInput'
import { StatusFilterBar } from './components/StatusFilterBar'
import { FilterChipBar } from './components/FilterChipBar'
import { TodoList } from './components/TodoList'
import { EmptyState } from './components/EmptyState'
import { Toast } from './components/Toast'

function SkeletonRow() {
  return <div className="mb-3 h-14 rounded-2xl border border-paper-line bg-paper-header motion-safe:animate-pulse" />
}

function AppContent() {
  const { state, dispatch } = useTodos()
  const { showToast } = useToast()
  const [hasLoadError, setHasLoadError] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status')
  const activeTags = useMemo(
    () => (searchParams.get('tags') ?? '').split(',').filter(Boolean),
    [searchParams],
  )

  const filteredTodos = useMemo(() => {
    let result = state.todos
    if (status === 'active') result = result.filter(t => !t.completed)
    else if (status === 'completed') result = result.filter(t => t.completed)
    if (activeTags.length > 0) {
      result = result.filter(t => t.tags.some(tag => activeTags.includes(tag)))
    }
    return result
  }, [state.todos, status, activeTags])

  const hasAnyFilters = status === 'active' || status === 'completed' || activeTags.length > 0

  const totalCount = state.todos.length
  const activeCount = useMemo(() => state.todos.filter(t => !t.completed).length, [state.todos])

  function clearAllFilters() {
    setSearchParams(new URLSearchParams())
  }

  useEffect(() => {
    fetchTodos()
      .then(todos => {
        dispatch({ type: 'SET_TODOS', payload: todos })
        setHasLoadError(false)
      })
      .catch(() => {
        dispatch({ type: 'SET_TODOS', payload: [] })
        setHasLoadError(true)
        showToast('Failed to load todos')
      })
  }, [dispatch, showToast])

  return (
    <main className="min-h-screen font-paper text-paper-text">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-paper backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-accent-gradient opacity-30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-accent-400 to-fuchsia-400 opacity-20 blur-3xl" />

          <header className="relative px-6 pt-7 pb-6 sm:px-8 sm:pt-9 sm:pb-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent-200/80 bg-accent-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-gradient" />
                  Focus list
                </div>
                <div>
                  <h1 className="bg-text-gradient bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                    My Tasks
                  </h1>
                  <p className="mt-2 text-sm text-paper-muted">
                    {totalCount === 0
                      ? 'A fresh slate — add your first task below.'
                      : `${activeCount} of ${totalCount} open · stay in flow.`}
                  </p>
                </div>
              </div>
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-lg shadow-accent-500/30 sm:flex">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </header>

          <div className="relative border-t border-paper-line/80 px-6 py-6 sm:px-8">
            {state.isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              <>
                <AddTodoInput />
                <StatusFilterBar />
                <FilterChipBar />
                {!hasLoadError && state.todos.length === 0 ? (
                  <EmptyState variant="empty" />
                ) : !hasLoadError && filteredTodos.length === 0 && hasAnyFilters ? (
                  <EmptyState variant="no-results" onClearFilters={clearAllFilters} />
                ) : (
                  <TodoList todos={filteredTodos} />
                )}
              </>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-paper-muted">
          Built for flow · Press <kbd className="rounded border border-paper-border bg-white px-1.5 py-0.5 font-sans text-[10px] text-paper-text">Enter</kbd> to add
        </p>
      </div>
      <Toast />
    </main>
  )
}

function App() {
  return (
    <ToastProvider>
      <TodoProvider>
        <AppContent />
      </TodoProvider>
    </ToastProvider>
  )
}

export default App
