import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import type { ITodoRepository } from '../repository/ITodoRepository.js'

declare module 'fastify' {
  interface FastifyInstance {
    repo: ITodoRepository
  }
}

function sanitiseTitle(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    const err = new Error('Title cannot be empty') as Error & { statusCode: number }
    err.statusCode = 400
    throw err
  }
  return trimmed
}

function sanitiseTags(raw: string[] = []): string[] {
  return [...new Set(raw.map((t) => t.trim()).filter((t) => t.length > 0))]
}

const todosPlugin: FastifyPluginAsync = fp(async (fastify: FastifyInstance) => {
  // Task 2: GET /api/todos (AC: 1, 4)
  fastify.get('/api/todos', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tags: { type: 'string' },
          status: { type: 'string', enum: ['all', 'active', 'completed'] },
        },
      },
    },
  }, async (request, reply) => {
    const { tags, status } = request.query as { tags?: string; status?: string }

    let todos = fastify.repo.getAll()

    if (status === 'active') {
      todos = todos.filter((t) => !t.completed)
    } else if (status === 'completed') {
      todos = todos.filter((t) => t.completed)
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      if (tagList.length > 0) {
        todos = todos.filter((t) => tagList.some((tag) => t.tags.includes(tag)))
      }
    }

    return reply.status(200).send(todos)
  })

  // Task 6: PUT /api/todos/reorder — MUST be before PUT /api/todos/:id (AC: 1)
  fastify.put('/api/todos/reorder', {
    schema: {
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: { type: 'array', items: { type: 'string' }, minItems: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const { ids } = request.body as { ids: string[] }
    fastify.repo.reorder(ids)
    return reply.status(204).send()
  })

  // Task 3: POST /api/todos (AC: 1, 2, 4)
  fastify.post('/api/todos', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { title: string; tags?: string[] }
    const title = sanitiseTitle(body.title)
    const tags = sanitiseTags(body.tags)
    const todo = fastify.repo.create({ title, tags })
    return reply.status(201).send(todo)
  })

  // Task 4: PUT /api/todos/:id (AC: 1, 4)
  fastify.put('/api/todos/:id', {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'completed', 'tags'],
        properties: {
          title: { type: 'string', minLength: 1 },
          completed: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { title: string; completed: boolean; tags: string[] }
    const title = sanitiseTitle(body.title)
    const tags = sanitiseTags(body.tags)
    const todo = fastify.repo.update(id, { title, completed: body.completed, tags })
    if (!todo) {
      const err = new Error('Todo not found') as Error & { statusCode: number }
      err.statusCode = 404
      throw err
    }
    return reply.status(200).send(todo)
  })

  // Task 5: DELETE /api/todos/:id (AC: 1)
  fastify.delete('/api/todos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = fastify.repo.getById(id)
    if (!existing) {
      const err = new Error('Todo not found') as Error & { statusCode: number }
      err.statusCode = 404
      throw err
    }
    fastify.repo.delete(id)
    return reply.status(204).send()
  })
})

export default todosPlugin
