import Fastify from 'fastify'
import type { ITodoRepository } from './repository/ITodoRepository.js'
import corsPlugin from './plugins/cors.js'
import todosPlugin from './routes/todos.js'

export function buildServer(options: { repo: ITodoRepository }) {
  const fastify = Fastify({
    logger: true,
  })

  // Allow Content-Type: application/json with an empty body (e.g. DELETE requests)
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    const str = body as string
    if (!str || str.trim() === '') return done(null, null)
    try {
      done(null, JSON.parse(str))
    } catch (e: unknown) {
      const err = e as Error & { statusCode?: number }
      err.statusCode = 400
      done(err, undefined)
    }
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
