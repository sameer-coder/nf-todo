import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toast } from './Toast'
import { ToastProvider, useToast } from '../context/ToastContext'
import { act } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'

function Wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

// Helper that triggers showToast via useEffect then renders Toast
function TriggerAndToast({ message }: { message: string }) {
  const { showToast } = useToast()
  useEffect(() => {
    showToast(message)
  }, [message, showToast])
  return <Toast />
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when message is null', () => {
    const { container } = render(
      <Wrapper>
        <Toast />
      </Wrapper>,
    )
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('renders message text when message is non-null', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <TriggerAndToast message="Something went wrong" />
        </ToastProvider>,
      )
    })
    expect(screen.getByText('Something went wrong')).toBeDefined()
  })

  it('has role="status" and aria-live="polite"', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <TriggerAndToast message="Error" />
        </ToastProvider>,
      )
    })
    const toast = screen.getByRole('status')
    expect(toast.getAttribute('aria-live')).toBe('polite')
  })

  it('clearToast is called after 4 seconds', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <TriggerAndToast message="Will dismiss" />
        </ToastProvider>,
      )
    })
    expect(screen.getByRole('status')).toBeDefined()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByRole('status')).toBeNull()
  })
})
