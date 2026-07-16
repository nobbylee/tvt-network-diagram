import jwt from 'jsonwebtoken'
import { db, type UserRow } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'tvt-dev-secret-change-me'
const JWT_EXPIRES_IN = '7d'

// 校验「TVT技术服务部平台」签发的 JWT 专用密钥，必须和主平台 server/.env 里的 JWT_SECRET 保持一致，
// 否则 handoff 免密登录会全部校验失败。跟本工具自己签发会话用的 JWT_SECRET 是两回事，不要混用。
const EXAM_SSO_SECRET = process.env.EXAM_SSO_SECRET

export type JwtPayload = {
  sub: number
  username: string
}

export type PublicUser = {
  id: number
  username: string
  displayName: string | null
  role: string | null
}

export type ExamTokenPayload = {
  sub: number
  account: string
  role: string
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
  }
}

/** 校验主平台签发的 JWT（handoff 免密登录用），跟本工具自己的 verifyToken 是两套密钥、两套载荷 */
export function verifyExamToken(token: string): ExamTokenPayload {
  if (!EXAM_SSO_SECRET) {
    throw new Error(
      'EXAM_SSO_SECRET 未配置：需要和主平台 server/.env 的 JWT_SECRET 配成一样的值，才能校验主平台传来的登录凭证',
    )
  }
  const decoded = jwt.verify(token, EXAM_SSO_SECRET, { algorithms: ['HS256'] })
  if (typeof decoded === 'string') {
    throw new Error('主平台 Token 载荷无效')
  }
  const payload = decoded as jwt.JwtPayload & { account?: string; role?: string }
  if (!payload.account) {
    throw new Error('主平台 Token 缺少 account 字段')
  }
  return {
    sub: Number(payload.sub),
    account: String(payload.account),
    role: String(payload.role ?? ''),
  }
}

/** 是否管理员（可查看全部项目）：以主平台同步过来的 role 为准 */
export function isAdmin(user: PublicUser | undefined): boolean {
  return user?.role === 'admin'
}

export function findUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

export function signToken(user: UserRow): string {
  const payload: JwtPayload = { sub: user.id, username: user.username }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET)
  if (typeof decoded === 'string') {
    throw new Error('Token 载荷无效')
  }
  const rawSub = decoded.sub
  const sub = typeof rawSub === 'number' ? rawSub : Number(rawSub)
  if (!Number.isFinite(sub)) {
    throw new Error('Token 载荷无效')
  }
  return {
    sub,
    username: String((decoded as jwt.JwtPayload & { username?: string }).username ?? ''),
  }
}
