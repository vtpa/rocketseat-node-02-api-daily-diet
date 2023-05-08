import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkUserIdCookie } from '../middlewares/check-user-id-cookie'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request) => {
      const { userId } = request.cookies
      const meals = await knex('meals').where('user_id', userId).select()
      return { meals }
    },
  )

  app.post(
    '/',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request) => {
      const { userId } = request.cookies
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })
      const { name, description, date, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )
      const newMeal = await knex('meals')
        .insert({
          id: randomUUID(),
          name,
          user_id: userId,
          description,
          date,
          is_on_diet: isOnDiet,
        })
        .returning('*')

      return newMeal
    },
  )
}
