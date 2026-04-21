import { useEffect, useState } from 'react'
import { TodoProvider, useTodos } from './context/TodoContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { fetchTodos } from './api/todos'
import { AddTodoInput } from './components/AddTodoInput'
import { TodoList } from './components/TodoList'
import { Toast } from './components/Toast'

function SkeletonRow() {
  return <div className="mb-2 h-10 rounded bg-neutral-100 motion-safe:animate-pulse" />
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
    <main className="min-h-screen bg-white font-sans">
      <div className="mx-auto max-w-2xl px-4 pt-12">
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

