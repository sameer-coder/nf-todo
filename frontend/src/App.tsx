import { useEffect } from 'react'
import { TodoProvider, useTodos } from './context/TodoContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { fetchTodos } from './api/todos'

function SkeletonRow() {
  return <div className="h-10 bg-neutral-100 rounded animate-pulse motion-safe:animate-pulse mb-2" />
}

function AppContent() {
  const { state, dispatch } = useTodos()
  const { showToast } = useToast()

  useEffect(() => {
    fetchTodos()
      .then(todos => dispatch({ type: 'SET_TODOS', payload: todos }))
      .catch(() => {
        dispatch({ type: 'SET_TODOS', payload: [] })
        showToast('Failed to load todos')
      })
  }, [dispatch, showToast])

  return (
    <main className="min-h-screen bg-white font-sans">
      <div className="mx-auto max-w-2xl px-4 pt-12">
        {state.isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : null}
      </div>
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

