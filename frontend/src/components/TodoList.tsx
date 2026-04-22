import { useRef } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { Todo } from '../types/todo'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { reorderTodos } from '../api/todos'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
}

export function TodoList({ todos }: TodoListProps) {
  const { dispatch } = useTodos()
  const { showToast } = useToast()
  const isReordering = useRef(false)
  const sorted = [...todos].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || isReordering.current) return
    isReordering.current = true

    const oldIndex = sorted.findIndex(t => t.id === active.id)
    const newIndex = sorted.findIndex(t => t.id === over.id)

    const previousTodos = sorted
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }))

    dispatch({ type: 'REORDER_OPTIMISTIC', payload: reordered })

    try {
      await reorderTodos(reordered.map(t => t.id))
    } catch {
      dispatch({ type: 'REORDER_ROLLBACK', payload: previousTodos })
      showToast('Something went wrong')
    } finally {
      isReordering.current = false
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {sorted.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
