import type { DeviceNode, DiagramEdge, DiagramNode } from '../types/diagram'
import { networkAddress } from './ip'
import type { ValidationIssue } from './types'

function isDeviceNode(node: DiagramNode): node is DeviceNode {
  return node.type === 'device'
}

/** 规范化 vlan 字符串；空则视为未填 */
function normalizeVlan(raw: string | undefined): string | null {
  if (raw == null) return null
  const s = raw.trim()
  return s === '' ? null : s
}

/**
 * 同一交换机上多条 connection 边填写了不同 vlan → warning。
 */
export function checkVlanMixIssues(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const node of nodes) {
    if (!isDeviceNode(node)) continue
    if (String(node.data.icon) !== 'switch') continue

    const vlanEdges: { edgeId: string; vlan: string }[] = []
    for (const edge of edges) {
      if (edge.type === 'annotation') continue
      if (edge.source !== node.id && edge.target !== node.id) continue
      const data = edge.data as { vlan?: string } | undefined
      const vlan = normalizeVlan(data?.vlan)
      if (vlan == null) continue
      vlanEdges.push({ edgeId: edge.id, vlan })
    }

    const distinct = new Set(vlanEdges.map((e) => e.vlan))
    if (distinct.size > 1) {
      issues.push({
        id: `vlan-mix:${node.id}`,
        rule: 'vlan-mix',
        severity: 'warning',
        message: `「${node.data.name}」上存在多个不同 VLAN：${[...distinct].join('、')}`,
        nodeIds: [node.id],
        edgeIds: vlanEdges.map((e) => e.edgeId),
      })
    }
  }

  return issues
}

/** 设备网络号；缺 IP/掩码或非法则 null */
function deviceNetwork(node: DeviceNode): string | null {
  const ip = node.data.ip
  const mask = node.data.subnetMask
  if (ip == null || mask == null) return null
  if (ip.trim() === '' || mask.trim() === '') return null
  return networkAddress(ip, mask)
}

/**
 * 同网段一致性：直连两端，或都直连同一 switch，且双方有 IP+掩码、网络号不同 → warning。
 */
export function checkSubnetIssues(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeById = new Map<string, DeviceNode>()
  for (const node of nodes) {
    if (isDeviceNode(node)) nodeById.set(node.id, node)
  }

  /** 已报告的设备对，避免重复 */
  const seenPairs = new Set<string>()

  function pairKey(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`
  }

  function maybeReport(a: DeviceNode, b: DeviceNode, edgeIds?: string[]) {
    const netA = deviceNetwork(a)
    const netB = deviceNetwork(b)
    if (netA == null || netB == null) return
    if (netA === netB) return
    const key = pairKey(a.id, b.id)
    if (seenPairs.has(key)) return
    seenPairs.add(key)
    issues.push({
      id: `ip-subnet:${key}`,
      rule: 'ip-subnet',
      severity: 'warning',
      message: `「${a.data.name}」与「${b.data.name}」网络号不一致（${netA} vs ${netB}）`,
      nodeIds: [a.id, b.id],
      edgeIds,
    })
  }

  // 1) 直连 connection 边两端
  for (const edge of edges) {
    if (edge.type === 'annotation') continue
    const a = nodeById.get(edge.source)
    const b = nodeById.get(edge.target)
    if (a == null || b == null) continue
    maybeReport(a, b, [edge.id])
  }

  // 2) 都直连同一 switch 的设备两两比较
  for (const node of nodes) {
    if (!isDeviceNode(node)) continue
    if (String(node.data.icon) !== 'switch') continue

    const neighbors: DeviceNode[] = []
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
      if (other != null) neighbors.push(other)
    }

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        maybeReport(neighbors[i], neighbors[j])
      }
    }
  }

  return issues
}
