import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db, type UserRow } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'tvt-dev-secret-change-me'
const JWT_EXPIRES_IN = '7d'

export type JwtPayload = {
  sub: number
  username: string
}

export type PublicUser = {
  id: number
  username: string
  displayName: string | null
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  }
}

export function findUserByUsername(username: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | UserRow
    | undefined
}

export function findUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash)
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
