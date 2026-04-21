import Fastify from 'fastify'
import type { ITodoRepository } from './repository/ITodoRepository.js'
import corsPlugin from './plugins/cors.js'
import todosPlugin from './routes/todos.js'

export function buildServer(options: { repo: ITodoRepository }) {
  const fastify = Fastify({
    logger: true,
  })

  // Decorate fastify with the repository for use in route handlers
  fastify.decorate('repo', options.repo)

  // Register CORS before routes
  fastify.register(corsPlugin)

  fastify.get('/api/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' })
  })

  // Register todo routes
  fastify.register(todosPlugin)

  return fastify
}
