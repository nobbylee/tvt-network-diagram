import type { DiagramNode } from '../types/diagram'

/** 吸附阈值（画布坐标，像素） */
export const SNAP_THRESHOLD = 10

export type SnapGuide = {
  /** 水平辅助线 Y（节点顶部对齐） */
  y?: number
  /** 垂直辅助线 X（节点左侧对齐） */
  x?: number
  /** 水平对齐参考节点 */
  horizontalTargetId?: string
  /** 垂直对齐参考节点 */
  verticalTargetId?: string
}

/**
 * 拖拽中：Y 接近则水平吸附，X 接近则垂直吸附。
 * 可同时吸附到不同参考节点的 X / Y。
 */
export function snapNodePosition(
  draggingId: string,
  position: { x: number; y: number },
  nodes: DiagramNode[],
  threshold = SNAP_THRESHOLD,
): { position: { x: number; y: number }; guide: SnapGuide | null } {
  let bestY: { y: number; targetId: string; dist: number } | null = null
  let bestX: { x: number; targetId: string; dist: number } | null = null

  for (const node of nodes) {
    if (node.id === draggingId) continue
    // 标注锚点不参与设备对齐
    if (node.type === 'anchor') continue

    const dy = Math.abs(position.y - node.position.y)
    if (dy <= threshold && (!bestY || dy < bestY.dist)) {
      bestY = { y: node.position.y, targetId: node.id, dist: dy }
    }

    const dx = Math.abs(position.x - node.position.x)
    if (dx <= threshold && (!bestX || dx < bestX.dist)) {
      bestX = { x: node.position.x, targetId: node.id, dist: dx }
    }
  }

  if (!bestY && !bestX) {
    return { position, guide: null }
  }

  return {
    position: {
      x: bestX ? bestX.x : position.x,
      y: bestY ? bestY.y : position.y,
    },
    guide: {
      y: bestY?.y,
      x: bestX?.x,
      horizontalTargetId: bestY?.targetId,
      verticalTargetId: bestX?.targetId,
    },
  }
}

/** 箭头端点吸附到附近设备节点中心（自由标注时用） */
export function snapPointToDevice(
  point: { x: number; y: number },
  nodes: DiagramNode[],
  threshold = 28,
): { point: { x: number; y: number }; nodeId: string | null } {
  let best: { id: string; x: number; y: number; dist: number } | null = null

  for (const node of nodes) {
    if (node.type !== 'device') continue
    const w = node.measured?.width ?? node.width ?? 160
    const h = node.measured?.height ?? node.height ?? 56
    const cx = node.position.x + w / 2
    const cy = node.position.y + h / 2
    const dist = Math.hypot(point.x - cx, point.y - cy)
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { id: node.id, x: cx, y: cy, dist }
    }
  }

  if (!best) return { point, nodeId: null }
  return { point: { x: best.x, y: best.y }, nodeId: best.id }
}
