import { useEffect } from 'react'
import { TodoProvider, useTodos } from './context/TodoContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { fetchTodos } from './api/todos'
import { AddTodoInput } from './components/AddTodoInput'
import { TodoList } from './components/TodoList'

function SkeletonRow() {
  return <div className="mb-2 h-10 rounded bg-neutral-100 motion-safe:animate-pulse" />
}

function ToastViewport() {
  const {
    toast: { message },
    clearToast,
  } = useToast()

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      clearToast()
    }, 3000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [clearToast, message])

  if (!message) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-10 flex justify-center">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md rounded border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-lg"
      >
        {message}
      </div>
    </div>
  )
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
        ) : (
          <>
            <AddTodoInput />
            <TodoList />
          </>
        )}
      </div>
      <ToastViewport />
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

