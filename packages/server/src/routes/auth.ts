import type { FastifyInstance } from 'fastify'
import { findOrCreateUserByAccount } from '../db.js'
import { signToken, toPublicUser, verifyExamToken } from '../auth.js'
import { requireAuth } from '../middleware/auth.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/auth/handoff — 免密登录：只接受「TVT技术服务部平台」签发的 JWT，
   * 不提供独立的账号密码登录入口。displayName 是主平台传来的展示名，仅用于同步显示，
   * 账号归属以 examToken 里校验过的 account 为准。
   */
  app.post<{
    Body: { examToken?: string; displayName?: string }
  }>('/api/auth/handoff', async (request, reply) => {
    const examToken = request.body?.examToken?.trim()
    if (!examToken) {
      return reply.code(400).send({ error: '缺少主平台登录凭证' })
    }

    let payload
    try {
      payload = verifyExamToken(examToken)
    } catch (err) {
      return reply.code(401).send({
        error: err instanceof Error ? err.message : '主平台登录凭证无效或已过期',
      })
    }

    const user = findOrCreateUserByAccount(
      payload.account,
      request.body?.displayName?.trim(),
      payload.role,
    )
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
