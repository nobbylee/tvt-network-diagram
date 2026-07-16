import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.env.DATA_DIR ?? './data')
const DB_PATH = path.join(DATA_DIR, 'app.db')

fs.mkdirSync(DATA_DIR, { recursive: true })

export const db: DatabaseType = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export type UserRow = {
  id: number
  username: string
  password: string
  display_name: string | null
  role: string | null
  created_at: string
}

export type ProjectRow = {
  id: number
  name: string
  customer: string | null
  author_id: number | null
  diagram: string
  is_public: number
  created_at: string
  updated_at: string
}

export type DiagramData = {
  nodes: unknown[]
  edges: unknown[]
}

/** 初始化表结构 */
export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      display_name TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      customer   TEXT,
      author_id  INTEGER REFERENCES users(id),
      diagram    TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
      is_public  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer);
    CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
  `)

  // 幂等补列：老库没有这些字段（新增列不会因为 schema 里加了字段就自动出现在已存在的表上）
  const userColumns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
  if (!userColumns.some((c) => c.name === 'role')) {
    db.exec('ALTER TABLE users ADD COLUMN role TEXT')
  }

  // 默认私人：所有项目在这个字段加入之前都视为私人（0），只有作者/管理员可见，需手动切换才公开
  const projectColumns = db.prepare('PRAGMA table_info(projects)').all() as Array<{ name: string }>
  if (!projectColumns.some((c) => c.name === 'is_public')) {
    db.exec('ALTER TABLE projects ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0')
  }
}

/**
 * 主平台 SSO 免密登录：按 account（作为本地 username）查找或自动建号。
 * 密码字段只是占位（本地永远不会走密码登录校验），displayName/role 每次都同步成主平台传来的最新值。
 */
export function findOrCreateUserByAccount(
  account: string,
  displayName: string | null | undefined,
  role: string | null | undefined,
): UserRow {
  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(account) as
    | UserRow
    | undefined

  if (existing) {
    db.prepare('UPDATE users SET display_name = ?, role = ? WHERE id = ?').run(
      displayName ?? existing.display_name,
      role ?? existing.role,
      existing.id,
    )
    return db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as UserRow
  }

  const placeholder = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10)
  const info = db
    .prepare('INSERT INTO users (username, password, display_name, role) VALUES (?, ?, ?, ?)')
    .run(account, placeholder, displayName ?? account, role ?? null)
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as UserRow
}

/** 启动时写入默认账号（已存在则跳过） */
export function seedUsers(): void {
  const defaults = [
    { username: 'admin', password: 'admin123', display_name: '管理员' },
    { username: 'zhangsan', password: '123456', display_name: '张三' },
  ]

  const find = db.prepare('SELECT id FROM users WHERE username = ?')
  const insert = db.prepare(
    'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
  )

  for (const u of defaults) {
    if (find.get(u.username)) continue
    const hash = bcrypt.hashSync(u.password, 10)
    insert.run(u.username, hash, u.display_name)
  }
}

export function parseDiagram(raw: string | null | undefined): DiagramData {
  if (!raw) return { nodes: [], edges: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<DiagramData>
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    }
  } catch {
    return { nodes: [], edges: [] }
  }
}

export function stringifyDiagram(diagram: DiagramData | undefined | null): string {
  return JSON.stringify({
    nodes: diagram?.nodes ?? [],
    edges: diagram?.edges ?? [],
  })
}

export { DATA_DIR, DB_PATH }
