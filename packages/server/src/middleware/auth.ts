import type { FastifyReply, FastifyRequest } from 'fastify'
import { findUserById, toPublicUser, verifyToken, type PublicUser } from '../auth.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: PublicUser
  }
}

/** 从 Authorization: Bearer <token> 解析当前用户 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: '未登录或 Token 缺失' })
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    return reply.code(401).send({ error: '未登录或 Token 缺失' })
  }

  try {
    const payload = verifyToken(token)
    const row = findUserById(payload.sub)
    if (!row) {
      return reply.code(401).send({ error: '用户不存在或已失效' })
    }
    request.user = toPublicUser(row)
  } catch {
    return reply.code(401).send({ error: 'Token 无效或已过期' })
  }
}
