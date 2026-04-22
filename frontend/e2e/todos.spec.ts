import { test, expect } from '@playwright/test'
import { createTodo, clearAllTodos } from './fixtures/index'

test.beforeEach(async ({ request }) => {
  await clearAllTodos(request)
})

test('create todo — type title, press Enter, item appears in list', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('Add a task…').waitFor()

  const input = page.getByPlaceholder('Add a task…')
  await input.fill('Buy groceries')

  const responsePromise = page.waitForResponse(
    res => res.url().includes('/api/todos') && res.request().method() === 'POST' && res.ok(),
  )
  await input.press('Enter')
  await responsePromise

  await expect(page.getByText('Buy groceries')).toBeVisible()
})

test('complete todo — click checkbox, item shows strikethrough styling', async ({ page, request }) => {
  await createTodo(request, 'Task to complete')
  await page.goto('/')
  await page.getByText('Task to complete').waitFor()

  const checkbox = page.getByLabel('Mark complete')
  await expect(checkbox).toHaveAttribute('aria-checked', 'false')

  const responsePromise = page.waitForResponse(
    res => res.url().includes('/api/todos/') && res.request().method() === 'PUT' && res.ok(),
  )
  await checkbox.click()
  await responsePromise

  await expect(checkbox).toHaveAttribute('aria-checked', 'true')
  const title = page.getByText('Task to complete')
  await expect(title).toHaveCSS('text-decoration-line', 'line-through')
})

test('delete todo — hover row, click delete icon, item removed from list', async ({ page, request }) => {
  await createTodo(request, 'Task to delete')
  await page.goto('/')
  await page.getByText('Task to delete').waitFor()

  const deleteBtn = page.getByLabel('Delete todo')
  // Force visibility for click since the button uses hover-based opacity
  const responsePromise = page.waitForResponse(
    res => res.url().includes('/api/todos/') && res.request().method() === 'DELETE',
  )
  await deleteBtn.click({ force: true })
  await responsePromise

  await expect(page.getByText('Task to delete')).not.toBeVisible()
})

test('reorder todos — drag todo to new position, order persists after reload', async ({ page, request }) => {
  await createTodo(request, 'First todo')
  await createTodo(request, 'Second todo')
  await page.goto('/')
  await page.getByText('Second todo').waitFor()

  const items = page.locator('li')
  await expect(items.nth(0)).toContainText('First todo')
  await expect(items.nth(1)).toContainText('Second todo')

  // Drag first item below the second using mouse sequences
  const dragHandles = page.getByLabel('Drag to reorder')
  const firstHandle = dragHandles.first()
  const secondItem = items.nth(1)

  const handleBox = await firstHandle.boundingBox()
  const targetBox = await secondItem.boundingBox()

  if (handleBox && targetBox) {
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/todos/reorder') && res.request().method() === 'PUT',
    )

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height + 10,
      { steps: 15 },
    )
    await page.mouse.up()

    await responsePromise
  }

  // Reload to verify persistence
  await page.reload()
  await page.getByText('First todo').waitFor()

  const reloadedItems = page.locator('li')
  await expect(reloadedItems.nth(0)).toContainText('Second todo')
  await expect(reloadedItems.nth(1)).toContainText('First todo')
})

test('filter by status — click Active hides completed, click All shows both', async ({ page, request }) => {
  await createTodo(request, 'Active task')
  const completedTodo = await createTodo(request, 'Completed task')

  // Complete the todo via API
  await request.put(`http://localhost:4000/api/todos/${completedTodo.id}`, {
    data: { title: 'Completed task', completed: true, tags: [] },
  })

  await page.goto('/')
  await page.getByText('Active task').waitFor()
  await page.getByText('Completed task').waitFor()

  // Click "Active" filter
  await page.getByRole('tab', { name: 'Active' }).click()
  await expect(page.getByText('Completed task')).not.toBeVisible()
  await expect(page.getByText('Active task')).toBeVisible()

  // Click "All" filter
  await page.getByRole('tab', { name: 'All' }).click()
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Completed task')).toBeVisible()
})
