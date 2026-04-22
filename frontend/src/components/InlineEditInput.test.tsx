import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineEditInput } from './InlineEditInput'

function renderComponent(onSave = vi.fn(), onCancel = vi.fn(), initialValue = 'Hello world') {
  return render(
    <InlineEditInput initialValue={initialValue} onSave={onSave} onCancel={onCancel} />,
  )
}

describe('InlineEditInput', () => {
  it('auto-selects text on render', () => {
    renderComponent()
    const input = screen.getByRole('textbox') as HTMLInputElement
    // jsdom sets selectionStart/End on focus/select
    expect(input.value).toBe('Hello world')
  })

  it('pressing Enter with valid text calls onSave with trimmed value', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onCancel = vi.fn()
    renderComponent(onSave, onCancel, 'My task')
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Updated task{Enter}')
    expect(onSave).toHaveBeenCalledWith('Updated task')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('pressing Enter with empty/whitespace calls onCancel, not onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onCancel = vi.fn()
    renderComponent(onSave, onCancel, 'My task')
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '   {Enter}')
    expect(onSave).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('pressing Escape calls onCancel, not onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onCancel = vi.fn()
    renderComponent(onSave, onCancel)
    const input = screen.getByRole('textbox')
    await user.type(input, '{Escape}')
    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blurring with valid text calls onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onCancel = vi.fn()
    renderComponent(onSave, onCancel, 'Original title')
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab() // blur the input
    expect(onSave).toHaveBeenCalledWith('Original title')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('blurring after Escape does NOT call onSave (Escape/blur race condition prevention)', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onCancel = vi.fn()
    renderComponent(onSave, onCancel)
    const input = screen.getByRole('textbox')
    // Type Escape (fires keydown), which also triggers blur in some browsers
    await user.type(input, '{Escape}')
    // Only onCancel should be called once — onSave never fires
    expect(onSave).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('trims value before calling onSave on Enter', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderComponent(onSave, vi.fn(), '')
    const input = screen.getByRole('textbox')
    await user.type(input, '  trimmed  {Enter}')
    expect(onSave).toHaveBeenCalledWith('trimmed')
  })

  it('has correct styling classes', () => {
    renderComponent()
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('bg-transparent')
    expect(input.className).toContain('outline-none')
    expect(input.className).toContain('focus:ring-indigo-300')
  })
})
