import { useEffect, useState } from 'react'
import { TodoProvider, useTodos } from './context/TodoContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { fetchTodos } from './api/todos'
import { AddTodoInput } from './components/AddTodoInput'
import { TodoList } from './components/TodoList'
import { Toast } from './components/Toast'

function SkeletonRow() {
  return <div className="mb-2 h-10 rounded bg-paper-line/50 motion-safe:animate-pulse" />
}

function AppContent() {
  const { state, dispatch } = useTodos()
  const { showToast } = useToast()
  const [hasLoadError, setHasLoadError] = useState(false)

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
    <main className="min-h-screen bg-paper-bg font-paper">
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Notebook card */}
        <div className="relative rounded overflow-hidden shadow-paper border border-paper-border">
          {/* Notebook header strip */}
          <div className="bg-paper-header px-6 py-3 border-b border-paper-border flex items-center gap-2">
            <svg className="w-4 h-4 text-paper-pencil opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
            </svg>
            <h1 className="text-paper-pencil font-semibold text-base tracking-wide">My Tasks</h1>
          </div>
          {/* Paper area */}
          <div className="relative bg-paper-surface">
            {/* Red margin line */}
            <div className="absolute left-14 top-0 bottom-0 w-px bg-paper-margin opacity-50 pointer-events-none" />
            {/* Content offset past the margin line */}
            <div className="pl-16 pr-4 py-4">
              {state.isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                <>
                  <AddTodoInput />
                  <TodoList showEmptyState={!hasLoadError} />
                </>
              )}
            </div>
          </div>
        </div>
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

