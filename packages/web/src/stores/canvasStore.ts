import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'
import type { DeviceBrand, DeviceIconType } from '../data/deviceLibrary'
import type {
  AnnotationEdge,
  AnnotationEdgeData,
  AnchorNode,
  ConnectionEdge,
  DeviceNode,
  DeviceNodeData,
  DiagramEdge,
  DiagramNode,
  DiagramSnapshot,
  TextNode,
  TextNodeData,
} from '../types/diagram'
import { snapNodePosition, type SnapGuide } from '../utils/snap'

const MAX_HISTORY = 50

const initialNodes: DiagramNode[] = [
  {
    id: '1',
    type: 'device',
    position: { x: 80, y: 120 },
    data: {
      name: '大门入口摄像机',
      model: 'TD-9544E3B-A',
      ip: '192.168.1.101',
      icon: 'ipc-bullet',
      brand: 'tvt',
    },
  },
  {
    id: '2',
    type: 'device',
    position: { x: 340, y: 100 },
    data: {
      name: '16路 PoE NVR',
      model: 'TD-3316H2-16P',
      ip: '192.168.1.10',
      icon: 'nvr',
      brand: 'tvt',
    },
  },
  {
    id: '3',
    type: 'device',
    position: { x: 340, y: 280 },
    data: {
      name: '核心交换机',
      ip: '192.168.1.1',
      icon: 'switch',
      brand: 'generic',
    },
  },
  {
    id: '4',
    type: 'device',
    position: { x: 600, y: 200 },
    data: {
      name: 'NVMS 平台',
      icon: 'nvms',
      brand: 'tvt',
    },
  },
]

const initialEdges: DiagramEdge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'labeled',
    data: { connectionType: 'PoE', sourcePort: 'LAN', targetPort: 'Port 1' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'labeled',
    data: { connectionType: 'LAN1', sourcePort: 'LAN1', targetPort: 'Port 8' },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'labeled',
    data: { connectionType: 'LAN2', sourcePort: 'LAN2', targetPort: 'ETH0' },
  },
]

function cloneSnapshot(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  }
}

type CanvasState = {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  past: DiagramSnapshot[]
  future: DiagramSnapshot[]
  zoomPercent: number
  snapGuide: SnapGuide | null
  /** 是否有未保存修改 */
  dirty: boolean

  onNodesChange: OnNodesChange<DiagramNode>
  onEdgesChange: OnEdgesChange<DiagramEdge>
  onConnect: (connection: Connection) => void

  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  setZoomPercent: (percent: number) => void
  clearSnapGuide: () => void

  updateNodeData: (
    id: string,
    patch: Partial<DeviceNodeData & TextNodeData & { attachedTo?: string }>,
  ) => void
  updateEdgeData: (
    id: string,
    patch: Partial<
      NonNullable<ConnectionEdge['data']> & NonNullable<AnnotationEdge['data']>
    >,
  ) => void
  addDeviceNode: (input: {
    name: string
    brand: DeviceBrand | string
    icon: DeviceIconType | string
    position: XYPosition
  }) => void
  addTextNode: (position: XYPosition, text?: string) => void
  addAnnotationArrow: (
    start: XYPosition,
    end: XYPosition,
    opts?: { startAttachedTo?: string; endAttachedTo?: string },
  ) => void
  deleteSelected: () => void
  copySelected: () => boolean
  pasteClipboard: () => boolean

  takeSnapshot: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  resetDiagram: (nodes?: DiagramNode[], edges?: DiagramEdge[]) => void
  markClean: () => void
  markDirty: () => void
}

type ClipboardPayload = {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

let clipboard: ClipboardPayload | null = null
const PASTE_OFFSET = 40

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: '2',
  selectedEdgeId: null,
  past: [],
  future: [],
  zoomPercent: 100,
  snapGuide: null,
  dirty: false,

  onNodesChange: (changes: NodeChange<DiagramNode>[]) => {
    const structural = changes.some(
      (c) => c.type === 'remove' || c.type === 'add' || c.type === 'replace',
    )
    const positionEnd = changes.some(
      (c) => c.type === 'position' && 'dragging' in c && c.dragging === false,
    )
    const isDragging = changes.some(
      (c) => c.type === 'position' && 'dragging' in c && c.dragging === true,
    )

    if (structural || positionEnd) {
      get().takeSnapshot()
      set({ dirty: true })
    }

    let snapGuide: SnapGuide | null = null
    const snappedChanges = changes.map((change) => {
      if (change.type !== 'position' || !change.position) return change
      const node = get().nodes.find((n) => n.id === change.id)
      // 锚点不参与设备网格吸附（箭头端点自由拖）
      if (node?.type === 'anchor') return change

      const { position, guide } = snapNodePosition(
        change.id,
        change.position,
        get().nodes,
      )
      if (guide && change.dragging !== false) {
        snapGuide = guide
      }
      return { ...change, position }
    })

    set({
      nodes: applyNodeChanges(snappedChanges, get().nodes),
      snapGuide: isDragging ? snapGuide : null,
    })
  },

  onEdgesChange: (changes: EdgeChange<DiagramEdge>[]) => {
    const structural = changes.some(
      (c) => c.type === 'remove' || c.type === 'add' || c.type === 'replace',
    )
    if (structural) {
      get().takeSnapshot()
      set({ dirty: true })
    }

    const nextEdges = applyEdgeChanges(changes, get().edges)
    const selectedEdgeId = get().selectedEdgeId
    set({
      edges: nextEdges,
      selectedEdgeId:
        selectedEdgeId && nextEdges.some((e) => e.id === selectedEdgeId)
          ? selectedEdgeId
          : null,
    })
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return
    // 锚点之间不走设备连线逻辑
    const nodes = get().nodes
    const src = nodes.find((n) => n.id === connection.source)
    const tgt = nodes.find((n) => n.id === connection.target)
    if (src?.type === 'anchor' || tgt?.type === 'anchor') return

    get().takeSnapshot()
    const edge: ConnectionEdge = {
      id: `e-${uuidv4()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'labeled',
      data: { connectionType: '网线' },
    }
    set({ edges: addEdge(edge, get().edges), dirty: true })
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setZoomPercent: (percent) => set({ zoomPercent: Math.round(percent) }),
  clearSnapGuide: () => set({ snapGuide: null }),

  updateNodeData: (id, patch) => {
    set({
      dirty: true,
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
      ) as DiagramNode[],
    })
  },

  updateEdgeData: (id, patch) => {
    set({
      dirty: true,
      edges: get().edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, ...patch } }
          : edge,
      ) as DiagramEdge[],
    })
  },

  addDeviceNode: ({ name, brand, icon, position }) => {
    get().takeSnapshot()
    const node: DeviceNode = {
      id: uuidv4(),
      type: 'device',
      position,
      data: { name, brand, icon },
    }
    set({
      nodes: [...get().nodes, node],
      selectedNodeId: node.id,
      selectedEdgeId: null,
      dirty: true,
    })
  },

  addTextNode: (position, text = '备注文字') => {
    get().takeSnapshot()
    const node: TextNode = {
      id: `text-${uuidv4()}`,
      type: 'text',
      position,
      data: { text, fontSize: 13, color: '#0f172a' },
      style: { width: 140 },
    }
    set({
      nodes: [...get().nodes, node],
      selectedNodeId: node.id,
      selectedEdgeId: null,
      dirty: true,
    })
  },

  addAnnotationArrow: (start, end, opts) => {
    get().takeSnapshot()
    const startId = `a-${uuidv4()}`
    const endId = `a-${uuidv4()}`
    const edgeId = `ann-${uuidv4()}`

    const startNode: AnchorNode = {
      id: startId,
      type: 'anchor',
      position: start,
      data: { attachedTo: opts?.startAttachedTo },
      draggable: true,
      selectable: true,
    }
    const endNode: AnchorNode = {
      id: endId,
      type: 'anchor',
      position: end,
      data: { attachedTo: opts?.endAttachedTo },
      draggable: true,
      selectable: true,
    }
    const edge: AnnotationEdge = {
      id: edgeId,
      source: startId,
      target: endId,
      sourceHandle: 'out',
      type: 'annotation',
      data: { kind: 'annotation', color: '#e11d48', strokeWidth: 2 },
      selectable: true,
    }

    set({
      nodes: [...get().nodes, startNode, endNode],
      edges: [...get().edges, edge],
      selectedEdgeId: edgeId,
      selectedNodeId: null,
      dirty: true,
    })
  },

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get()
    const selectedIds = new Set(
      nodes.filter((n) => n.selected).map((n) => n.id),
    )
    if (selectedNodeId) selectedIds.add(selectedNodeId)

    if (selectedIds.size === 0 && !selectedEdgeId) return
    get().takeSnapshot()

    if (selectedIds.size > 0) {
      // 选中锚点时，带上整条标注箭头的两端
      const expandIds = new Set(selectedIds)
      for (const e of edges) {
        if (
          e.type === 'annotation' &&
          (selectedIds.has(e.source) || selectedIds.has(e.target))
        ) {
          expandIds.add(e.source)
          expandIds.add(e.target)
        }
      }
      set({
        nodes: nodes.filter((n) => !expandIds.has(n.id)),
        edges: edges.filter(
          (e) => !expandIds.has(e.source) && !expandIds.has(e.target),
        ),
        selectedNodeId: null,
        selectedEdgeId: null,
        dirty: true,
      })
      return
    }

    if (selectedEdgeId) {
      const edge = edges.find((e) => e.id === selectedEdgeId)
      if (edge?.type === 'annotation') {
        const anchorIds = new Set([edge.source, edge.target])
        set({
          nodes: nodes.filter((n) => !anchorIds.has(n.id)),
          edges: edges.filter((e) => e.id !== selectedEdgeId),
          selectedEdgeId: null,
          dirty: true,
        })
        return
      }
      set({
        edges: edges.filter((e) => e.id !== selectedEdgeId),
        selectedEdgeId: null,
        dirty: true,
      })
    }
  },

  copySelected: () => {
    const { nodes, edges, selectedNodeId, selectedEdgeId } = get()
    const selectedIds = new Set(
      nodes.filter((n) => n.selected).map((n) => n.id),
    )
    if (selectedNodeId) selectedIds.add(selectedNodeId)

    // 复制标注箭头：带上两端锚点
    if (selectedEdgeId) {
      const edge = edges.find((e) => e.id === selectedEdgeId)
      if (edge?.type === 'annotation') {
        selectedIds.add(edge.source)
        selectedIds.add(edge.target)
      }
    }

    if (selectedIds.size === 0) return false

    // 标注箭头若只选一端，补全另一端
    for (const e of edges) {
      if (
        e.type === 'annotation' &&
        (selectedIds.has(e.source) || selectedIds.has(e.target))
      ) {
        selectedIds.add(e.source)
        selectedIds.add(e.target)
      }
    }

    const copiedNodes = nodes
      .filter((n) => selectedIds.has(n.id))
      .map((n) => structuredClone(n))
    const copiedEdges = edges
      .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
      .map((e) => structuredClone(e))

    clipboard = { nodes: copiedNodes, edges: copiedEdges }
    return true
  },

  pasteClipboard: () => {
    if (!clipboard || clipboard.nodes.length === 0) return false
    get().takeSnapshot()

    const idMap = new Map<string, string>()
    for (const n of clipboard.nodes) {
      idMap.set(n.id, uuidv4())
    }

    const newNodes: DiagramNode[] = clipboard.nodes.map((n) => {
      const id = idMap.get(n.id)!
      const base = {
        ...structuredClone(n),
        id,
        position: {
          x: n.position.x + PASTE_OFFSET,
          y: n.position.y + PASTE_OFFSET,
        },
        selected: true,
      }
      return base as DiagramNode
    })

    const newEdges: DiagramEdge[] = clipboard.edges.map((e) => {
      const id = `e-${uuidv4()}`
      return {
        ...structuredClone(e),
        id,
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        selected: false,
      } as DiagramEdge
    })

    // 取消原选中，选中粘贴结果
    const cleared = get().nodes.map((n) => ({ ...n, selected: false }))
    const firstId = newNodes[0]?.id ?? null

    set({
      nodes: [...cleared, ...newNodes],
      edges: [...get().edges, ...newEdges],
      selectedNodeId: firstId,
      selectedEdgeId: null,
      dirty: true,
    })

    // 连续粘贴继续偏移
    clipboard = {
      nodes: clipboard.nodes.map((n) => ({
        ...n,
        position: {
          x: n.position.x + PASTE_OFFSET,
          y: n.position.y + PASTE_OFFSET,
        },
      })),
      edges: clipboard.edges,
    }

    return true
  },

  takeSnapshot: () => {
    const { nodes, edges, past } = get()
    const nextPast = [...past, cloneSnapshot(nodes, edges)].slice(-MAX_HISTORY)
    set({ past: nextPast, future: [] })
  },

  undo: () => {
    const { past, nodes, edges, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [cloneSnapshot(nodes, edges), ...future].slice(0, MAX_HISTORY),
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      snapGuide: null,
      dirty: true,
    })
  },

  redo: () => {
    const { future, nodes, edges, past } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      future: future.slice(1),
      past: [...past, cloneSnapshot(nodes, edges)].slice(-MAX_HISTORY),
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      snapGuide: null,
      dirty: true,
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  resetDiagram: (nodes = initialNodes, edges = initialEdges) => {
    set({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      past: [],
      future: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      snapGuide: null,
      dirty: false,
    })
  },

  markClean: () => set({ dirty: false }),
  markDirty: () => set({ dirty: true }),
}))

// 供类型收窄使用
export type { AnnotationEdgeData }
