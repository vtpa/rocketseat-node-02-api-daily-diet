import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    execSync('npm run knex migrate:latest')
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Janta',
        description: 'Jantar é bom demais!',
        date: '2023-05-12T09:01:01.001Z',
        isOnDiet: true,
      })
      .expect(201)
  })

  it('should be able to edit a meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Janta',
        description: 'Jantar é bom demais!',
        date: '2023-05-12T09:01:01.001Z',
        isOnDiet: true,
      })

    const newDescription = 'Sopa não é janta!'

    await request(app.server)
      .put(`/meals/${createMealResponse.body.id}`)
      .set('Cookie', cookie)
      .send({
        description: newDescription,
      })
      .expect(200)
      .then((response) => {
        expect(response.body.description).toEqual(newDescription)
      })
  })

  it('should be able to delete a meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Janta',
        description: 'Jantar é bom demais!',
        date: '2023-05-12T09:01:01.001Z',
        isOnDiet: true,
      })

    await request(app.server)
      .delete(`/meals/${createMealResponse.body.id}`)
      .set('Cookie', cookie)
      .expect(202)
  })

  it('should be able to list all meals from a user', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Almoço',
      description: 'Almoçar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Janta',
      description: 'Jantar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server)
      .get(`/meals`)
      .set('Cookie', cookie)
      .then((response) => {
        expect(response.body.meals).length(2)
      })
  })

  it('should be able to list a specific meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Almoço',
        description: 'Almoçar é bom demais!',
        date: '2023-05-12T09:01:01.001Z',
        isOnDiet: true,
      })

    await request(app.server)
      .get(`/meals/${createMealResponse.body.id}`)
      .set('Cookie', cookie)
      .then((response) => {
        expect(response.body).toMatchObject({
          id: expect.any(String),
          user_id: expect.any(String),
          name: 'Almoço',
          description: 'Almoçar é bom demais!',
          is_on_diet: expect.any(Number),
          date: expect.any(Number),
          created_at: expect.any(String),
        })
      })
  })

  it('should be able to get the total number of registered meals', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Almoço',
      description: 'Almoçar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Janta',
      description: 'Jantar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server)
      .get(`/meals/totalMeals`)
      .set('Cookie', cookie)
      .then((response) => {
        expect(response.body.totalMeals).toBe(2)
      })
  })

  it('should be able to get the total number of registered meals on Diet', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Almoço',
      description: 'Almoçar é bom demais!',
      date: '2023-05-12T03:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Janta',
      description: 'Jantar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lanche',
      description: 'X-Burger da praça',
      date: '2023-05-12T11:01:01.001Z',
      isOnDiet: false,
    })

    await request(app.server)
      .get(`/meals/totalMeals/onDiet`)
      .set('Cookie', cookie)
      .then((response) => {
        expect(response.body.totalMeals).toBe(2)
      })
  })

  it('should be able to get the total number of registered meals off Diet', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Almoço',
      description: 'Almoçar é bom demais!',
      date: '2023-05-12T03:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Janta',
      description: 'Jantar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lanche',
      description: 'X-Burger da praça',
      date: '2023-05-12T11:01:01.001Z',
      isOnDiet: false,
    })

    await request(app.server)
      .get(`/meals/totalMeals/offDiet`)
      .set('Cookie', cookie)
      .then((response) => {
        expect(response.body.totalMeals).toBe(1)
      })
  })

  it('should be able to get the best sequence per day of meals on Diet', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      avatarUrl: 'https://avatars.githubusercontent.com/u/59664490?v=4',
    })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Almoço',
      description: 'Almoçar é bom demais!',
      date: '2023-05-12T03:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Janta',
      description: 'Jantar é bom demais!',
      date: '2023-05-12T09:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lanche',
      description: 'X-Burger da praça',
      date: '2023-05-12T11:01:01.001Z',
      isOnDiet: false,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Almoço',
      description: 'Almoçar é bom demais!',
      date: '2023-05-13T03:01:01.001Z',
      isOnDiet: true,
    })

    await request(app.server)
      .get(`/meals/bestSequenceOnDiet`)
      .set('Cookie', cookie)
      .then((response) => {
        expect(response.body.bestSequenceOnDiet).toBe(2)
      })
  })
})
