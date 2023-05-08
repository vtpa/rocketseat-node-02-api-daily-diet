import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    let userId = request.cookies.userId

    if (userId) {
      return
    }
    const createUserBodySchema = z.object({
      avatarUrl: z.string(),
    })

    const { avatarUrl } = createUserBodySchema.parse(request.body)

    userId = randomUUID()

    const newUser = await knex('users')
      .insert({
        id: userId,
        avatar_url: avatarUrl,
      })
      .returning('*')

    reply
      .setCookie('userId', userId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
      .send(newUser)
  })
}
