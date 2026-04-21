import Fastify from 'fastify'
import type { ITodoRepository } from './repository/ITodoRepository.js'

export function buildServer(options: { repo: ITodoRepository }) {
  const fastify = Fastify({
    logger: true,
  })

  // Decorate fastify with the repository for use in route handlers
  fastify.decorate('repo', options.repo)

  fastify.get('/api/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' })
  })

  return fastify
}
