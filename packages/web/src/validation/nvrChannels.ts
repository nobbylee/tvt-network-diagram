import type { DeviceNode, DiagramEdge, DiagramNode } from '../types/diagram'
import type { ValidationIssue } from './types'

/** 录像机图标 */
const RECORDER_ICONS = new Set(['nvr', 'dvr'])

/** 计入 NVR 通道的摄像机图标 */
const CAMERA_ICONS = new Set([
  'ipc-bullet',
  'ipc-dome',
  'ipc-turret',
  'ipc-fisheye',
  'ptz',
])

function isDeviceNode(node: DiagramNode): node is DeviceNode {
  return node.type === 'device'
}

/**
 * 检查 NVR/DVR 通道占用：直连摄像机数超过 maxChannels 报错；
 * 未填 maxChannels 给出建议填写警告。
 */
export function checkNvrChannelIssues(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeById = new Map<string, DeviceNode>()
  for (const node of nodes) {
    if (isDeviceNode(node)) nodeById.set(node.id, node)
  }

  for (const node of nodes) {
    if (!isDeviceNode(node)) continue
    if (!RECORDER_ICONS.has(String(node.data.icon))) continue

    const maxChannels = node.data.maxChannels
    if (maxChannels == null) {
      issues.push({
        id: `nvr-channels-missing:${node.id}`,
        rule: 'nvr-channels-missing',
        severity: 'warning',
        message: '建议填写通道数',
        nodeIds: [node.id],
      })
      continue
    }

    let count = 0
    for (const edge of edges) {
      if (edge.type === 'annotation') continue
      const otherId =
        edge.source === node.id
          ? edge.target
          : edge.target === node.id
            ? edge.source
            : null
      if (otherId == null) continue
      const other = nodeById.get(otherId)
      if (other == null) continue
      if (CAMERA_ICONS.has(String(other.data.icon))) count++
    }

    if (count > maxChannels) {
      issues.push({
        id: `nvr-channels:${node.id}`,
        rule: 'nvr-channels',
        severity: 'error',
        message: `「${node.data.name}」已接入 ${count} 路摄像机，超过最大通道数 ${maxChannels}`,
        nodeIds: [node.id],
      })
    }
  }

  return issues
}
