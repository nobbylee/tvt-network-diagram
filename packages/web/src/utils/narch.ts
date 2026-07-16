import type {
  AnnotationEdge,
  ConnectionEdge,
  DeviceNode,
  DiagramEdge,
  DiagramNode,
  TextNode,
  AnchorNode,
} from '../types/diagram'

/** .narch 文件中的节点（文档约定） */
export type NarchNode = {
  id: string
  /** 设备图标类型，或 text / anchor */
  type: string
  brand?: string
  model?: string
  name?: string
  ip?: string
  subnetMask?: string
  gateway?: string
  maxChannels?: number
  poeBudgetW?: number
  poePortCount?: number
  powerDrawW?: number
  mac?: string
  location?: string
  notes?: string
  position: { x: number; y: number }
  /** 文本标注 */
  text?: string
  fontSize?: number
  color?: string
  /** 锚点吸附设备 */
  attachedTo?: string
  width?: number
}

export type NarchEdge = {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  connectionType?: string
  vlan?: string
  bandwidthMbps?: number
  notes?: string
  /** annotation = 标注箭头 */
  kind?: 'connection' | 'annotation'
  color?: string
  strokeWidth?: number
  label?: string
}

export type NarchFile = {
  version: string
  meta: {
    projectName: string
    customer?: string
    author?: string
    createdAt?: string
    updatedAt?: string
  }
  nodes: NarchNode[]
  edges: NarchEdge[]
}

const BRAND_TO_EXPORT: Record<string, string> = {
  tvt: 'TVT',
  generic: '通用网络',
}

const BRAND_FROM_IMPORT: Record<string, string> = {
  tvt: 'tvt',
  TVT: 'tvt',
  Tvt: 'tvt',
  // 旧「第三方」导入后归入通用网络
  第三方: 'generic',
  third: 'generic',
  Third: 'generic',
  通用网络: 'generic',
  generic: 'generic',
  Generic: 'generic',
  通用: 'generic',
}

/** 空字符串导入为 undefined */
function emptyToUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined
}

/** 导出 brand：优先中文标签，未知值原样保留 */
export function brandToNarch(brand: string): string {
  return BRAND_TO_EXPORT[brand] ?? brand
}

/** 导入 brand：兼容 TVT / 通用网络；旧第三方归入 generic */
export function brandFromNarch(brand: string): string {
  if (!brand) return ''
  return BRAND_FROM_IMPORT[brand] ?? brand.toLowerCase()
}

export function diagramToNarch(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  meta: {
    projectName: string
    customer?: string
    author?: string
    createdAt?: string
    updatedAt?: string
  },
): NarchFile {
  return {
    version: '1.2',
    meta: {
      projectName: meta.projectName,
      customer: meta.customer ?? '',
      author: meta.author ?? '',
      createdAt: meta.createdAt ?? new Date().toISOString(),
      updatedAt: meta.updatedAt ?? new Date().toISOString(),
    },
    nodes: nodes.map((node) => {
      if (node.type === 'text') {
        const t = node as TextNode
        return {
          id: t.id,
          type: 'text',
          text: t.data.text,
          fontSize: t.data.fontSize,
          color: t.data.color,
          position: { x: t.position.x, y: t.position.y },
          width: typeof t.style?.width === 'number' ? t.style.width : undefined,
        }
      }
      if (node.type === 'anchor') {
        const a = node as AnchorNode
        return {
          id: a.id,
          type: 'anchor',
          attachedTo: a.data.attachedTo,
          position: { x: a.position.x, y: a.position.y },
        }
      }
      const d = node as DeviceNode
      return {
        id: d.id,
        type: String(d.data.icon ?? 'server'),
        brand: brandToNarch(String(d.data.brand ?? '')),
        model: d.data.model ?? '',
        name: d.data.name,
        ip: d.data.ip ?? '',
        subnetMask: d.data.subnetMask ?? '',
        gateway: d.data.gateway ?? '',
        maxChannels: d.data.maxChannels,
        poeBudgetW: d.data.poeBudgetW,
        poePortCount: d.data.poePortCount,
        powerDrawW: d.data.powerDrawW,
        mac: d.data.mac ?? '',
        location: d.data.location ?? '',
        notes: d.data.notes ?? '',
        position: { x: d.position.x, y: d.position.y },
      }
    }),
    edges: edges.map((edge) => {
      if (edge.type === 'annotation') {
        const a = edge as AnnotationEdge
        return {
          id: a.id,
          source: a.source,
          target: a.target,
          kind: 'annotation' as const,
          color: a.data?.color,
          strokeWidth: a.data?.strokeWidth,
          label: a.data?.label,
        }
      }
      const c = edge as ConnectionEdge
      return {
        id: c.id,
        source: c.source,
        target: c.target,
        kind: 'connection' as const,
        sourcePort: c.data?.sourcePort ?? '',
        targetPort: c.data?.targetPort ?? '',
        connectionType: c.data?.connectionType ?? '',
        vlan: c.data?.vlan ?? '',
        bandwidthMbps: c.data?.bandwidthMbps,
        notes: c.data?.notes ?? '',
      }
    }),
  }
}

export function narchToDiagram(file: NarchFile): {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  meta: NarchFile['meta']
} {
  const nodes: DiagramNode[] = (file.nodes ?? []).map((n) => {
    if (n.type === 'text') {
      const node: TextNode = {
        id: n.id,
        type: 'text',
        position: n.position ?? { x: 0, y: 0 },
        data: {
          text: n.text || '备注文字',
          fontSize: n.fontSize ?? 13,
          color: n.color ?? '#0f172a',
        },
        style: n.width ? { width: n.width } : { width: 140 },
      }
      return node
    }
    if (n.type === 'anchor') {
      const node: AnchorNode = {
        id: n.id,
        type: 'anchor',
        position: n.position ?? { x: 0, y: 0 },
        data: { attachedTo: n.attachedTo },
        draggable: true,
        selectable: true,
      }
      return node
    }
    const node: DeviceNode = {
      id: n.id,
      type: 'device',
      position: n.position ?? { x: 0, y: 0 },
      data: {
        name: n.name || '未命名设备',
        brand: brandFromNarch(n.brand ?? 'generic'),
        icon: n.type || 'server',
        model: emptyToUndefined(n.model),
        ip: emptyToUndefined(n.ip),
        subnetMask: emptyToUndefined(n.subnetMask),
        gateway: emptyToUndefined(n.gateway),
        maxChannels: n.maxChannels,
        poeBudgetW: n.poeBudgetW,
        poePortCount: n.poePortCount,
        powerDrawW: n.powerDrawW,
        mac: emptyToUndefined(n.mac),
        location: emptyToUndefined(n.location),
        notes: emptyToUndefined(n.notes),
      },
    }
    return node
  })

  const edges: DiagramEdge[] = (file.edges ?? []).map((e) => {
    if (e.kind === 'annotation') {
      const edge: AnnotationEdge = {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: 'out',
        type: 'annotation',
        data: {
          kind: 'annotation',
          color: e.color ?? '#e11d48',
          strokeWidth: e.strokeWidth ?? 2,
          label: e.label,
        },
      }
      return edge
    }
    const edge: ConnectionEdge = {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'labeled',
      data: {
        sourcePort: emptyToUndefined(e.sourcePort),
        targetPort: emptyToUndefined(e.targetPort),
        connectionType: emptyToUndefined(e.connectionType),
        vlan: emptyToUndefined(e.vlan),
        bandwidthMbps: e.bandwidthMbps,
        notes: emptyToUndefined(e.notes),
      },
    }
    return edge
  })

  return {
    nodes,
    edges,
    meta: file.meta ?? { projectName: '未命名项目' },
  }
}

export function parseNarchJson(text: string): NarchFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('无效的 .narch 文件')
  }
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    throw new Error('.narch 文件缺少 nodes 或 edges')
  }
  return {
    version: String(obj.version ?? '1.0'),
    meta: (obj.meta as NarchFile['meta']) ?? { projectName: '未命名项目' },
    nodes: obj.nodes as NarchNode[],
    edges: obj.edges as NarchEdge[],
  }
}

export async function readNarchFile(file: File): Promise<NarchFile> {
  const text = await file.text()
  return parseNarchJson(text)
}

/** 将 .narch 对象下载为本地文件 */
export function downloadNarchFile(narch: NarchFile, filename?: string) {
  const blob = new Blob([JSON.stringify(narch, null, 2)], {
    type: 'application/json',
  })
  const name =
    filename ??
    `${(narch.meta.projectName || 'project').replace(/[\\/:*?"<>|]/g, '_')}.narch`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name.endsWith('.narch') ? name : `${name}.narch`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
