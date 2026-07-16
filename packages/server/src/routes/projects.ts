import type { FastifyInstance } from 'fastify'
import {
  db,
  parseDiagram,
  stringifyDiagram,
  type DiagramData,
  type ProjectRow,
} from '../db.js'
import { findUserById, isAdmin, type PublicUser } from '../auth.js'
import { requireAuth } from '../middleware/auth.js'
import {
  diagramToNarch,
  narchToDiagram,
  parseNarchFile,
  type NarchFile,
} from '../narch.js'

type ProjectListItem = {
  id: number
  name: string
  customer: string
  author: string
  authorId: number | null
  isPublic: boolean
  deviceCount: number
  edgeCount: number
  createdAt: string
  updatedAt: string
}

type ProjectDetail = ProjectListItem & {
  diagram: DiagramData
}

function authorName(authorId: number | null): string {
  if (!authorId) return ''
  const u = findUserById(authorId)
  return u?.display_name || u?.username || ''
}

function toListItem(row: ProjectRow): ProjectListItem {
  const diagram = parseDiagram(row.diagram)
  return {
    id: row.id,
    name: row.name,
    customer: row.customer ?? '',
    author: authorName(row.author_id),
    authorId: row.author_id,
    isPublic: !!row.is_public,
    deviceCount: diagram.nodes.length,
    edgeCount: diagram.edges.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toDetail(row: ProjectRow): ProjectDetail {
  return {
    ...toListItem(row),
    diagram: parseDiagram(row.diagram),
  }
}

function getProject(id: number): ProjectRow | undefined {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
    | ProjectRow
    | undefined
}

function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'project'
}

// 只读访问：作者本人、管理员，或者项目被作者手动设为公开（is_public）
function canReadProject(
  row: ProjectRow,
  userId: number | undefined,
  user: PublicUser | undefined,
): boolean {
  if (isAdmin(user)) return true
  if (row.is_public) return true
  if (userId == null) return false
  // 无归属的旧项目仅管理员可见
  if (row.author_id == null) return false
  return row.author_id === userId
}

// 编辑/删除/改可见性：只有作者本人和管理员，公开项目对其他人也只是"能看"，不代表"能改"
function canWriteProject(
  row: ProjectRow,
  userId: number | undefined,
  user: PublicUser | undefined,
): boolean {
  if (isAdmin(user)) return true
  if (userId == null) return false
  if (row.author_id == null) return false
  return row.author_id === userId
}

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  /** GET /api/projects?search=&customer= */
  app.get<{
    Querystring: { search?: string; customer?: string }
  }>('/api/projects', { preHandler: requireAuth }, async (request) => {
    const search = request.query.search?.trim()
    const customer = request.query.customer?.trim()
    const userId = request.user?.id
    const admin = isAdmin(request.user)

    let sql = 'SELECT * FROM projects WHERE 1=1'
    const params: (string | number)[] = []

    if (!admin) {
      sql += ' AND (author_id = ? OR is_public = 1)'
      params.push(userId!)
    }

    if (search) {
      sql += ' AND (name LIKE ? OR customer LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (customer) {
      sql += ' AND customer = ?'
      params.push(customer)
    }

    sql += ' ORDER BY updated_at DESC'

    const rows = db.prepare(sql).all(...params) as ProjectRow[]
    return { items: rows.map(toListItem) }
  })

  /** POST /api/projects/import — 必须在 :id 路由之前注册 */
  app.post('/api/projects/import', { preHandler: requireAuth }, async (request, reply) => {
    let narch: NarchFile

    const contentType = request.headers['content-type'] ?? ''

    if (contentType.includes('multipart/form-data')) {
      const file = await request.file()
      if (!file) {
        return reply.code(400).send({ error: '请上传 .narch 文件' })
      }
      const buf = await file.toBuffer()
      let parsed: unknown
      try {
        parsed = JSON.parse(buf.toString('utf8'))
      } catch {
        return reply.code(400).send({ error: '.narch 文件不是合法 JSON' })
      }
      try {
        narch = parseNarchFile(parsed)
      } catch (err) {
        return reply.code(400).send({
          error: err instanceof Error ? err.message : '无效的 .narch 文件',
        })
      }
    } else {
      // JSON body：直接传 .narch 对象，或 { narch: {...} }
      const body = request.body as Record<string, unknown> | null
      if (!body) {
        return reply.code(400).send({ error: '请提供 .narch JSON 内容' })
      }
      try {
        narch = parseNarchFile(
          body.version || body.nodes ? body : (body.narch as unknown),
        )
      } catch (err) {
        return reply.code(400).send({
          error: err instanceof Error ? err.message : '无效的 .narch 内容',
        })
      }
    }

    const diagram = narchToDiagram(narch)
    const name = narch.meta.projectName || '导入项目'
    const customer = narch.meta.customer || ''
    const authorId = request.user?.id ?? null
    const now = new Date().toISOString()

    const result = db
      .prepare(
        `INSERT INTO projects (name, customer, author_id, diagram, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(name, customer, authorId, stringifyDiagram(diagram), now, now)

    const row = getProject(Number(result.lastInsertRowid))
    if (!row) {
      return reply.code(500).send({ error: '导入失败' })
    }
    return reply.code(201).send(toDetail(row))
  })

  /** POST /api/projects */
  app.post<{
    Body: {
      name?: string
      customer?: string
      diagram?: DiagramData
    }
  }>('/api/projects', { preHandler: requireAuth }, async (request, reply) => {
    const name = request.body?.name?.trim()
    if (!name) {
      return reply.code(400).send({ error: '项目名称不能为空' })
    }

    const customer = request.body?.customer?.trim() ?? ''
    const diagram = request.body?.diagram ?? { nodes: [], edges: [] }
    const authorId = request.user?.id ?? null
    const now = new Date().toISOString()

    const result = db
      .prepare(
        `INSERT INTO projects (name, customer, author_id, diagram, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(name, customer, authorId, stringifyDiagram(diagram), now, now)

    const row = getProject(Number(result.lastInsertRowid))
    if (!row) {
      return reply.code(500).send({ error: '创建失败' })
    }
    return reply.code(201).send(toDetail(row))
  })

  /** GET /api/projects/:id/export */
  app.get<{ Params: { id: string } }>(
    '/api/projects/:id/export',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ error: '无效的项目 ID' })
      }

      const row = getProject(id)
      if (!row) {
        return reply.code(404).send({ error: '项目不存在' })
      }
      if (!canReadProject(row, request.user?.id, request.user)) {
        return reply.code(403).send({ error: '无权访问该项目' })
      }

      const diagram = parseDiagram(row.diagram)
      const narch = diagramToNarch(diagram, {
        projectName: row.name,
        customer: row.customer ?? '',
        author: authorName(row.author_id),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })

      const filename = `${safeFilename(row.name)}.narch`
      reply.header('Content-Type', 'application/json; charset=utf-8')
      reply.header(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      )
      return reply.send(narch)
    },
  )

  /** GET /api/projects/:id */
  app.get<{ Params: { id: string } }>(
    '/api/projects/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ error: '无效的项目 ID' })
      }

      const row = getProject(id)
      if (!row) {
        return reply.code(404).send({ error: '项目不存在' })
      }
      if (!canReadProject(row, request.user?.id, request.user)) {
        return reply.code(403).send({ error: '无权访问该项目' })
      }
      return toDetail(row)
    },
  )

  /** PUT /api/projects/:id */
  app.put<{
    Params: { id: string }
    Body: {
      name?: string
      customer?: string
      diagram?: DiagramData
      isPublic?: boolean
    }
  }>('/api/projects/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = Number(request.params.id)
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: '无效的项目 ID' })
    }

    const row = getProject(id)
    if (!row) {
      return reply.code(404).send({ error: '项目不存在' })
    }
    if (!canWriteProject(row, request.user?.id, request.user)) {
      return reply.code(403).send({ error: '无权修改该项目' })
    }

    const body = request.body ?? {}
    const name =
      body.name !== undefined ? body.name.trim() : row.name
    if (!name) {
      return reply.code(400).send({ error: '项目名称不能为空' })
    }

    const customer =
      body.customer !== undefined ? body.customer.trim() : (row.customer ?? '')
    const diagramJson =
      body.diagram !== undefined
        ? stringifyDiagram(body.diagram)
        : row.diagram
    const isPublic =
      body.isPublic !== undefined ? (body.isPublic ? 1 : 0) : row.is_public
    const now = new Date().toISOString()

    db.prepare(
      `UPDATE projects
       SET name = ?, customer = ?, diagram = ?, is_public = ?, updated_at = ?
       WHERE id = ?`,
    ).run(name, customer, diagramJson, isPublic, now, id)

    const updated = getProject(id)
    return toDetail(updated!)
  })

  /** DELETE /api/projects/:id */
  app.delete<{ Params: { id: string } }>(
    '/api/projects/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ error: '无效的项目 ID' })
      }

      const row = getProject(id)
      if (!row) {
        return reply.code(404).send({ error: '项目不存在' })
      }
      if (!canWriteProject(row, request.user?.id, request.user)) {
        return reply.code(403).send({ error: '无权删除该项目' })
      }

      db.prepare('DELETE FROM projects WHERE id = ?').run(id)
      return { ok: true, id }
    },
  )
}
