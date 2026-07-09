import type { DiagramData } from './db.js'

/** .narch 公开格式节点 */
export type NarchNode = {
  id: string
  type: string
  brand: string
  model?: string
  name: string
  ip?: string
  notes?: string
  position: { x: number; y: number }
}

/** .narch 公开格式连线 */
export type NarchEdge = {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  connectionType?: string
  notes?: string
}

export type NarchFile = {
  version: string
  meta: {
    projectName: string
    customer: string
    author: string
    createdAt: string
    updatedAt: string
  }
  nodes: NarchNode[]
  edges: NarchEdge[]
}

/** React Flow 节点（存储格式） */
type RfNode = {
  id: string
  type?: string
  position?: { x: number; y: number }
  data?: {
    name?: string
    brand?: string
    icon?: string
    model?: string
    ip?: string
    notes?: string
  }
}

/** React Flow 边（存储格式） */
type RfEdge = {
  id: string
  source: string
  target: string
  type?: string
  data?: {
    sourcePort?: string
    targetPort?: string
    connectionType?: string
    notes?: string
  }
  sourceHandle?: string | null
  targetHandle?: string | null
}

const BRAND_TO_NARCH: Record<string, string> = {
  tvt: 'TVT',
  generic: '通用网络',
}

const BRAND_FROM_NARCH: Record<string, string> = {
  TVT: 'tvt',
  tvt: 'tvt',
  // 旧「第三方」导入后归入通用网络
  第三方: 'generic',
  third: 'generic',
  通用网络: 'generic',
  generic: 'generic',
}

export function brandToNarch(brand: string | undefined): string {
  if (!brand) return 'TVT'
  return BRAND_TO_NARCH[brand] ?? brand
}

export function brandFromNarch(brand: string | undefined): string {
  if (!brand) return 'tvt'
  return BRAND_FROM_NARCH[brand] ?? brand.toLowerCase()
}

/** React Flow diagram → .narch */
export function diagramToNarch(
  diagram: DiagramData,
  meta: NarchFile['meta'],
): NarchFile {
  const nodes = (diagram.nodes as RfNode[]).map((n) => ({
    id: n.id,
    type: n.data?.icon ?? 'ipc-bullet',
    brand: brandToNarch(n.data?.brand),
    model: n.data?.model ?? '',
    name: n.data?.name ?? '',
    ip: n.data?.ip ?? '',
    notes: n.data?.notes ?? '',
    position: {
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
    },
  }))

  const edges = (diagram.edges as RfEdge[]).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourcePort: e.data?.sourcePort ?? '',
    targetPort: e.data?.targetPort ?? '',
    connectionType: e.data?.connectionType ?? '',
    notes: e.data?.notes ?? '',
  }))

  return {
    version: '1.0',
    meta,
    nodes,
    edges,
  }
}

/** .narch → React Flow diagram */
export function narchToDiagram(narch: NarchFile): DiagramData {
  const nodes = (narch.nodes ?? []).map((n) => ({
    id: n.id,
    type: 'device',
    position: {
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
    },
    data: {
      name: n.name ?? '',
      brand: brandFromNarch(n.brand),
      icon: n.type || 'ipc-bullet',
      model: n.model ?? '',
      ip: n.ip ?? '',
      notes: n.notes ?? '',
    },
  }))

  const edges = (narch.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'labeled',
    data: {
      sourcePort: e.sourcePort ?? '',
      targetPort: e.targetPort ?? '',
      connectionType: e.connectionType ?? '',
      notes: e.notes ?? '',
    },
  }))

  return { nodes, edges }
}

/** 解析并校验 .narch JSON */
export function parseNarchFile(raw: unknown): NarchFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('无效的 .narch 内容')
  }

  const obj = raw as Partial<NarchFile>
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    throw new Error('.narch 缺少 nodes 或 edges')
  }

  const meta = obj.meta ?? {
    projectName: '未命名项目',
    customer: '',
    author: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return {
    version: obj.version ?? '1.0',
    meta: {
      projectName: meta.projectName ?? '未命名项目',
      customer: meta.customer ?? '',
      author: meta.author ?? '',
      createdAt: meta.createdAt ?? new Date().toISOString(),
      updatedAt: meta.updatedAt ?? new Date().toISOString(),
    },
    nodes: obj.nodes as NarchNode[],
    edges: obj.edges as NarchEdge[],
  }
}
