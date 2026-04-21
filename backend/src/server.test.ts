import { describe, it, expect, vi } from 'vitest'
import { buildServer } from './server.js'
import type { ITodoRepository } from './repository/ITodoRepository.js'

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    // Create a mock repository
    const mockRepo: ITodoRepository = {
      getAll: vi.fn(() => []),
      getById: vi.fn(() => undefined),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      reorder: vi.fn(),
    }

    const app = buildServer({ repo: mockRepo })
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
