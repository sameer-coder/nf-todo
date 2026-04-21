/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Todo } from '../types/todo'

export interface TodoState {
  todos: Todo[]
  isLoading: boolean
}

export type TodoAction =
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO_OPTIMISTIC'; payload: Todo }
  | { type: 'ADD_TODO_ROLLBACK'; payload: string }
  | { type: 'UPDATE_TODO_OPTIMISTIC'; payload: Todo }
  | { type: 'UPDATE_TODO_ROLLBACK'; payload: Todo }
  | { type: 'DELETE_TODO_OPTIMISTIC'; payload: string }
  | { type: 'DELETE_TODO_ROLLBACK'; payload: Todo }
  | { type: 'REORDER_OPTIMISTIC'; payload: Todo[] }
  | { type: 'REORDER_ROLLBACK'; payload: Todo[] }

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'SET_TODOS':
      return { ...state, todos: action.payload, isLoading: false }
    case 'ADD_TODO_OPTIMISTIC':
      return { ...state, todos: [...state.todos, action.payload] }
    case 'ADD_TODO_ROLLBACK':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) }
    case 'UPDATE_TODO_OPTIMISTIC':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'UPDATE_TODO_ROLLBACK':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TODO_OPTIMISTIC':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) }
    case 'DELETE_TODO_ROLLBACK':
      return { ...state, todos: [...state.todos, action.payload].sort((a, b) => a.order - b.order) }
    case 'REORDER_OPTIMISTIC':
      return { ...state, todos: action.payload }
    case 'REORDER_ROLLBACK':
      return { ...state, todos: action.payload }
    default:
      return state
  }
}

const initialState: TodoState = {
  todos: [],
  isLoading: true,
}

interface TodoContextValue {
  state: TodoState
  dispatch: React.Dispatch<TodoAction>
}

const TodoContext = createContext<TodoContextValue | null>(null)

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, initialState)
  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      {children}
    </TodoContext.Provider>
  )
}

export function useTodos(): TodoContextValue {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos must be used within a TodoProvider')
  return ctx
}
