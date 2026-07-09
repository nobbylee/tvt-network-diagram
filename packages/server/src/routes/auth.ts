import type { FastifyInstance } from 'fastify'
import {
  findUserByUsername,
  signToken,
  toPublicUser,
  verifyPassword,
} from '../auth.js'
import { requireAuth } from '../middleware/auth.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /** POST /api/auth/login */
  app.post<{
    Body: { username?: string; password?: string }
  }>('/api/auth/login', async (request, reply) => {
    const username = request.body?.username?.trim()
    const password = request.body?.password

    if (!username || !password) {
      return reply.code(400).send({ error: '请提供用户名和密码' })
    }

    const user = findUserByUsername(username)
    if (!user || !verifyPassword(password, user.password)) {
      return reply.code(401).send({ error: '用户名或密码错误' })
    }

    const token = signToken(user)
    return { token, user: toPublicUser(user) }
  })

  /** GET /api/auth/me */
  app.get('/api/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: '未登录' })
    }
    return { user: request.user }
  })
}
