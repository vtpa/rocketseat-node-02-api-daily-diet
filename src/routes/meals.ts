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
  app.get(
    '/:id',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request) => {
      const { userId } = request.cookies
      const getMealByIdParamSchema = z.object({
        id: z.string(),
      })
      const { id } = getMealByIdParamSchema.parse(request.params)
      const meal = await knex('meals')
        .where('user_id', userId)
        .andWhere('id', id)
        .first()
      return meal
    },
  )
  app.get(
    '/totalMeals',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request) => {
      const { userId } = request.cookies
      const mealsCount = await knex('meals')
        .where('user_id', userId)
        .count('id', { as: 'totalMeals' })
      return mealsCount
    },
  )
  app.get(
    '/totalMeals/:isOnDiet',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request) => {
      const { userId } = request.cookies
      const getMealByIdParamSchema = z.object({
        isOnDiet: z.enum(['onDiet', 'offDiet']),
      })
      const { isOnDiet } = getMealByIdParamSchema.parse(request.params)
      const mealsCount = await knex('meals')
        .where('user_id', userId)
        .andWhere('is_on_diet', isOnDiet === 'onDiet')
        .count('id', { as: 'totalMeals' })
      return mealsCount
    },
  )
  app.get(
    '/bestSequenceOnDiet',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request) => {
      const { userId } = request.cookies

      const bestSequenceOnDiet = await knex('meals')
        .where('user_id', userId)
        .orderBy('date', 'desc')
        .then((rows) => {
          const maxInterval = rows.reduce(
            (acc, row) => {
              if (row.is_on_diet) {
                acc.currentInterval += 1
              } else {
                if (acc.currentInterval > acc.maxInterval) {
                  acc.maxInterval = acc.currentInterval
                }
                acc.currentInterval = 0
              }
              return acc
            },
            { maxInterval: 0, currentInterval: 0 },
          ).maxInterval
          return maxInterval
        })

      return { bestSequenceOnDiet }
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
  app.put(
    '/:id',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request, reply) => {
      const { userId } = request.cookies
      const updateMealByIdParamSchema = z.object({
        id: z.string(),
      })
      const { id } = updateMealByIdParamSchema.parse(request.params)

      const createMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.coerce.date().optional(),
        isOnDiet: z.boolean().optional(),
      })
      const { name, description, date, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )

      const mealToUpdate = await knex('meals')
        .where('user_id', userId)
        .andWhere('id', id)
        .first()

      if (!mealToUpdate) {
        return reply.status(422).send({
          error: 'Meal not found!',
        })
      }

      const updatedMeal = await knex('meals')
        .where('user_id', userId)
        .andWhere('id', id)
        .update({
          ...mealToUpdate,
          name,
          description,
          date,
          is_on_diet: isOnDiet,
        })
        .returning('*')

      return updatedMeal
    },
  )
  app.delete(
    '/:id',
    {
      preHandler: [checkUserIdCookie],
    },
    async (request, reply) => {
      const { userId } = request.cookies
      const deleteMealByIdParamSchema = z.object({
        id: z.string(),
      })
      const { id } = deleteMealByIdParamSchema.parse(request.params)

      const mealToDelete = await knex('meals')
        .where('user_id', userId)
        .andWhere('id', id)
        .first()

      if (!mealToDelete) {
        return reply.status(422).send({
          error: 'Meal not found!',
        })
      }

      await knex('meals').where('user_id', userId).andWhere('id', id).del()

      return reply.status(202).send()
    },
  )
}
