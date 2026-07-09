import type { DiagramEdge, DiagramNode } from '../types/diagram'
import { apiRequest, downloadBlob } from './client'

export type DiagramPayload = {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export type ProjectSummary = {
  id: string
  name: string
  customer?: string | null
  author?: string | null
  authorName?: string | null
  deviceCount?: number
  edgeCount?: number
  updatedAt?: string
  createdAt?: string
}

export type ProjectDetail = ProjectSummary & {
  diagram?: DiagramPayload | null
}

export type ListProjectsParams = {
  search?: string
  customer?: string
}

function normalizeProject(raw: Record<string, unknown>): ProjectSummary {
  const id = String(raw.id ?? '')
  const diagram = raw.diagram as DiagramPayload | undefined
  const deviceCount =
    typeof raw.deviceCount === 'number'
      ? raw.deviceCount
      : Array.isArray(diagram?.nodes)
        ? diagram.nodes.length
        : undefined
  const edgeCount =
    typeof raw.edgeCount === 'number'
      ? raw.edgeCount
      : Array.isArray(diagram?.edges)
        ? diagram.edges.length
        : undefined

  return {
    id,
    name: String(raw.name ?? '未命名项目'),
    customer: (raw.customer as string | null | undefined) ?? '',
    author: (() => {
      if (typeof raw.authorName === 'string' && raw.authorName) return raw.authorName
      if (typeof raw.author === 'string') return raw.author
      if (raw.author && typeof raw.author === 'object' && 'displayName' in raw.author) {
        return String((raw.author as { displayName?: string }).displayName ?? '')
      }
      return ''
    })(),
    deviceCount,
    edgeCount,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  }
}

function extractList(data: unknown): ProjectSummary[] {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeProject(item as Record<string, unknown>))
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const list = (obj.items ?? obj.projects ?? obj.data) as unknown
    if (Array.isArray(list)) {
      return list.map((item) => normalizeProject(item as Record<string, unknown>))
    }
  }
  return []
}

export async function listProjects(
  params: ListProjectsParams = {},
): Promise<ProjectSummary[]> {
  const qs = new URLSearchParams()
  if (params.search?.trim()) qs.set('search', params.search.trim())
  if (params.customer?.trim()) qs.set('customer', params.customer.trim())
  const query = qs.toString()
  const data = await apiRequest<unknown>(
    `/api/projects${query ? `?${query}` : ''}`,
  )
  return extractList(data)
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const data = await apiRequest<Record<string, unknown>>(`/api/projects/${id}`)
  const summary = normalizeProject(data)
  const diagram = (data.diagram as DiagramPayload | null | undefined) ?? {
    nodes: [],
    edges: [],
  }
  return { ...summary, diagram }
}

export async function createProject(input: {
  name: string
  customer?: string
  diagram?: DiagramPayload
}): Promise<ProjectDetail> {
  const data = await apiRequest<Record<string, unknown>>('/api/projects', {
    method: 'POST',
    body: input,
  })
  const summary = normalizeProject(data)
  return {
    ...summary,
    diagram: (data.diagram as DiagramPayload | undefined) ?? input.diagram ?? {
      nodes: [],
      edges: [],
    },
  }
}

export async function updateProject(
  id: string,
  input: {
    name?: string
    customer?: string
    diagram?: DiagramPayload
  },
): Promise<ProjectDetail> {
  const data = await apiRequest<Record<string, unknown>>(`/api/projects/${id}`, {
    method: 'PUT',
    body: input,
  })
  return {
    ...normalizeProject(data),
    diagram: (data.diagram as DiagramPayload | undefined) ?? input.diagram,
  }
}

export async function removeProject(id: string): Promise<void> {
  await apiRequest(`/api/projects/${id}`, { method: 'DELETE' })
}

/** 从后端下载 .narch 文件 */
export async function exportNarch(id: string, filename?: string): Promise<void> {
  const blob = await apiRequest<Blob>(`/api/projects/${id}/export`, {
    responseType: 'blob',
  })
  downloadBlob(blob, filename ?? `project-${id}.narch`)
}

/**
 * 导入 .narch：支持 multipart 文件或 JSON 正文。
 * 返回新建/导入后的项目详情。
 */
export async function importNarch(
  input: File | Record<string, unknown>,
): Promise<ProjectDetail> {
  if (input instanceof File) {
    const form = new FormData()
    form.append('file', input)
    const data = await apiRequest<Record<string, unknown>>('/api/projects/import', {
      method: 'POST',
      rawBody: form,
    })
    return {
      ...normalizeProject(data),
      diagram: data.diagram as DiagramPayload | undefined,
    }
  }

  const data = await apiRequest<Record<string, unknown>>('/api/projects/import', {
    method: 'POST',
    body: input,
  })
  return {
    ...normalizeProject(data),
    diagram: data.diagram as DiagramPayload | undefined,
  }
}
