import type { DiagramData } from './db.js'

/** .narch 公开格式节点 */
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

/** .narch 公开格式连线 */
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
  style?: { width?: number; [key: string]: unknown }
  data?: {
    name?: string
    brand?: string
    icon?: string
    model?: string
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
    text?: string
    fontSize?: number
    color?: string
    attachedTo?: string
  }
  draggable?: boolean
  selectable?: boolean
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
    vlan?: string
    bandwidthMbps?: number
    notes?: string
    kind?: 'annotation' | 'connection'
    color?: string
    strokeWidth?: number
    label?: string
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

/** 空字符串导入为 undefined */
function emptyToUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined
}

export function brandToNarch(brand: string | undefined): string {
  if (!brand) return ''
  return BRAND_TO_NARCH[brand] ?? brand
}

export function brandFromNarch(brand: string | undefined): string {
  if (!brand) return ''
  return BRAND_FROM_NARCH[brand] ?? brand.toLowerCase()
}

/** React Flow diagram → .narch */
export function diagramToNarch(
  diagram: DiagramData,
  meta: NarchFile['meta'],
): NarchFile {
  const nodes = (diagram.nodes as RfNode[]).map((n): NarchNode => {
    if (n.type === 'text') {
      return {
        id: n.id,
        type: 'text',
        text: n.data?.text ?? '',
        fontSize: n.data?.fontSize,
        color: n.data?.color,
        position: {
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0,
        },
        width: typeof n.style?.width === 'number' ? n.style.width : undefined,
      }
    }
    if (n.type === 'anchor') {
      return {
        id: n.id,
        type: 'anchor',
        attachedTo: n.data?.attachedTo,
        position: {
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0,
        },
      }
    }
    return {
      id: n.id,
      type: n.data?.icon ?? 'ipc-bullet',
      brand: brandToNarch(n.data?.brand),
      model: n.data?.model ?? '',
      name: n.data?.name ?? '',
      ip: n.data?.ip ?? '',
      subnetMask: n.data?.subnetMask ?? '',
      gateway: n.data?.gateway ?? '',
      maxChannels: n.data?.maxChannels,
      poeBudgetW: n.data?.poeBudgetW,
      poePortCount: n.data?.poePortCount,
      powerDrawW: n.data?.powerDrawW,
      mac: n.data?.mac ?? '',
      location: n.data?.location ?? '',
      notes: n.data?.notes ?? '',
      position: {
        x: n.position?.x ?? 0,
        y: n.position?.y ?? 0,
      },
    }
  })

  const edges = (diagram.edges as RfEdge[]).map((e): NarchEdge => {
    if (e.type === 'annotation' || e.data?.kind === 'annotation') {
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        kind: 'annotation',
        color: e.data?.color,
        strokeWidth: e.data?.strokeWidth,
        label: e.data?.label,
      }
    }
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      kind: 'connection',
      sourcePort: e.data?.sourcePort ?? '',
      targetPort: e.data?.targetPort ?? '',
      connectionType: e.data?.connectionType ?? '',
      vlan: e.data?.vlan ?? '',
      bandwidthMbps: e.data?.bandwidthMbps,
      notes: e.data?.notes ?? '',
    }
  })

  return {
    version: '1.2',
    meta,
    nodes,
    edges,
  }
}

/** .narch → React Flow diagram */
export function narchToDiagram(narch: NarchFile): DiagramData {
  const nodes = (narch.nodes ?? []).map((n): RfNode => {
    if (n.type === 'text') {
      return {
        id: n.id,
        type: 'text',
        position: {
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0,
        },
        data: {
          text: n.text || '备注文字',
          fontSize: n.fontSize ?? 13,
          color: n.color ?? '#0f172a',
        },
        style: n.width ? { width: n.width } : { width: 140 },
      }
    }
    if (n.type === 'anchor') {
      return {
        id: n.id,
        type: 'anchor',
        position: {
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0,
        },
        data: { attachedTo: n.attachedTo },
        draggable: true,
        selectable: true,
      }
    }
    return {
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
        model: emptyToUndefined(n.model) ?? '',
        ip: emptyToUndefined(n.ip) ?? '',
        subnetMask: emptyToUndefined(n.subnetMask),
        gateway: emptyToUndefined(n.gateway),
        maxChannels: n.maxChannels,
        poeBudgetW: n.poeBudgetW,
        poePortCount: n.poePortCount,
        powerDrawW: n.powerDrawW,
        mac: emptyToUndefined(n.mac),
        location: emptyToUndefined(n.location),
        notes: emptyToUndefined(n.notes) ?? '',
      },
    }
  })

  const edges = (narch.edges ?? []).map((e): RfEdge => {
    if (e.kind === 'annotation') {
      return {
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
    }
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'labeled',
      data: {
        sourcePort: e.sourcePort ?? '',
        targetPort: e.targetPort ?? '',
        connectionType: e.connectionType ?? '',
        vlan: emptyToUndefined(e.vlan),
        bandwidthMbps: e.bandwidthMbps,
        notes: e.notes ?? '',
      },
    }
  })

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
