import { FastifyReply, FastifyRequest } from 'fastify'

export async function checkUserIdCookie(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.cookies.userId) {
    return reply.status(401).send({
      error: 'Unauthorized.',
    })
  }
}
