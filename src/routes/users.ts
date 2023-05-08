import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    let userId = request.cookies.userId

    if (userId) {
      return
    }
    userId = randomUUID()

    const newUser = await knex('users')
      .insert({
        id: userId,
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
