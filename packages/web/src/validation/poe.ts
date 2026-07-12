import type { DeviceNode, DiagramEdge, DiagramNode } from '../types/diagram'
import { defaultPowerDrawW } from './defaults'
import type { ValidationIssue } from './types'

function isDeviceNode(node: DiagramNode): node is DeviceNode {
  return node.type === 'device'
}

/**
 * 检查交换机 PoE 预算、余量与口数。
 * 未填 poeBudgetW 时跳过预算/余量规则，口数仍可检。
 */
export function checkPoeIssues(
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
    if (String(node.data.icon) !== 'switch') continue

    const budget = node.data.poeBudgetW
    const portCount = node.data.poePortCount

    /** 该交换机上的 PoE 边 */
    const poeEdges = edges.filter((edge) => {
      if (edge.type === 'annotation') return false
      const data = edge.data as { connectionType?: string } | undefined
      if (data?.connectionType !== 'PoE') return false
      return edge.source === node.id || edge.target === node.id
    })

    if (portCount != null && poeEdges.length > portCount) {
      issues.push({
        id: `poe-ports:${node.id}`,
        rule: 'poe-ports',
        severity: 'error',
        message: `「${node.data.name}」PoE 连接 ${poeEdges.length} 路，超过 PoE 口数 ${portCount}`,
        nodeIds: [node.id],
        edgeIds: poeEdges.map((e) => e.id),
      })
    }

    // 未填预算则跳过瓦数相关规则
    if (budget == null) continue

    let sum = 0
    let usedDefault = false
    const unestimatedEdgeIds: string[] = []

    for (const edge of poeEdges) {
      const otherId = edge.source === node.id ? edge.target : edge.source
      const other = nodeById.get(otherId)
      if (other == null) {
        unestimatedEdgeIds.push(edge.id)
        continue
      }

      if (other.data.powerDrawW != null) {
        sum += other.data.powerDrawW
        continue
      }

      const def = defaultPowerDrawW(String(other.data.icon))
      if (def != null) {
        sum += def
        usedDefault = true
        continue
      }

      unestimatedEdgeIds.push(edge.id)
    }

    for (const edgeId of unestimatedEdgeIds) {
      issues.push({
        id: `poe-unestimated:${edgeId}`,
        rule: 'poe-unestimated',
        severity: 'warning',
        message: `「${node.data.name}」的 PoE 链路无法估算对端功耗，未计入预算`,
        nodeIds: [node.id],
        edgeIds: [edgeId],
      })
    }

    const estimateHint = usedDefault ? '（按默认功耗估算）' : ''

    if (sum > budget) {
      issues.push({
        id: `poe-budget:${node.id}`,
        rule: 'poe-budget',
        severity: 'error',
        message: `「${node.data.name}」PoE 功耗合计 ${sum}W，超过预算 ${budget}W${estimateHint}`,
        nodeIds: [node.id],
        edgeIds: poeEdges.map((e) => e.id),
        estimated: usedDefault || undefined,
      })
    } else if (sum > budget * 0.8) {
      issues.push({
        id: `poe-headroom:${node.id}`,
        rule: 'poe-headroom',
        severity: 'warning',
        message: `「${node.data.name}」PoE 功耗合计 ${sum}W，已超过预算 ${budget}W 的 80%${estimateHint}`,
        nodeIds: [node.id],
        edgeIds: poeEdges.map((e) => e.id),
        estimated: usedDefault || undefined,
      })
    }
  }

  return issues
}
