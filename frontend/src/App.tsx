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
  return <div className="mb-3 h-14 rounded-2xl border border-paper-line/80 bg-paper-header/70 motion-safe:animate-pulse" />
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

  const hasAnyFilters = !!status || activeTags.length > 0

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
    <main className="min-h-screen bg-paper-bg font-paper text-paper-text">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] border border-paper-border/80 bg-paper-surface/88 shadow-paper backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-paper-ink/10 via-[#dfe9dd] to-[#f0f4e8]" />
          <div className="relative border-b border-paper-line/90 px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-paper-border/80 bg-paper-surface/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-paper-muted">
                  Focus list
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">My Tasks</h1>
                  <p className="mt-1 text-sm text-paper-muted">Keep today tidy with a clear, lightweight task flow.</p>
                </div>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-paper-border/80 bg-paper-surface/90 text-paper-ink shadow-sm sm:flex">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-7 5h8m-9 5h10M7 5.5A1.5 1.5 0 108.5 7 1.5 1.5 0 007 5.5zm0 5A1.5 1.5 0 108.5 12 1.5 1.5 0 007 10.5zm0 5A1.5 1.5 0 108.5 17 1.5 1.5 0 007 15.5z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="relative px-6 py-5 sm:px-8 sm:py-6">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-paper-line to-transparent" />
            <div className="rounded-[24px] border border-paper-line/80 bg-paper-surface/92 p-4 sm:p-5">
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
          </div>
        </section>
      </div>
      <Toast />
    </main>
  )
}

function App() {
  return (
    <TodoProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </TodoProvider>
  )
}

export default App

