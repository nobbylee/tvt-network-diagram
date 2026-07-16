import type { Edge, Node } from '@xyflow/react'
import type { DeviceBrand, DeviceIconType } from '../data/deviceLibrary'

/** 设备节点业务数据 */
export type DeviceNodeData = {
  name: string
  brand?: DeviceBrand | string
  icon: DeviceIconType | string
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
}

/** 文本标注节点 */
export type TextNodeData = {
  text: string
  fontSize?: number
  color?: string
}

/** 箭头端点锚点（不可见，可拖拽） */
export type AnchorNodeData = {
  /** 可选：吸附到的设备节点 id */
  attachedTo?: string
}

/** 设备连线业务数据 */
export type ConnectionEdgeData = {
  sourcePort?: string
  targetPort?: string
  connectionType?: '网线' | '光纤' | 'PoE' | 'WiFi' | '4G' | string
  vlan?: string
  bandwidthMbps?: number
  notes?: string
}

/** 标注箭头业务数据 */
export type AnnotationEdgeData = {
  kind: 'annotation'
  color?: string
  strokeWidth?: number
  label?: string
}

export type DeviceNode = Node<DeviceNodeData, 'device'>
export type TextNode = Node<TextNodeData, 'text'>
export type AnchorNode = Node<AnchorNodeData, 'anchor'>
export type DiagramNode = DeviceNode | TextNode | AnchorNode

export type ConnectionEdge = Edge<ConnectionEdgeData, 'labeled'>
export type AnnotationEdge = Edge<AnnotationEdgeData, 'annotation'>
export type DiagramEdge = ConnectionEdge | AnnotationEdge

export type DiagramSnapshot = {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}
