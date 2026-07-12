import type { DiagramEdge, DiagramNode } from '../types/diagram'
import { checkIpIssues } from './ip'
import { checkNvrChannelIssues } from './nvrChannels'
import { checkPoeIssues } from './poe'
import { checkSubnetIssues, checkVlanMixIssues } from './subnet'
import type { ValidationIssue } from './types'

/**
 * 汇总校验入口：按顺序 concat
 * IP（格式/冲突 + 同网段）→ NVR → PoE → VLAN。
 */
export function validateDiagram(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): ValidationIssue[] {
  return [
    ...checkIpIssues(nodes),
    ...checkSubnetIssues(nodes, edges),
    ...checkNvrChannelIssues(nodes, edges),
    ...checkPoeIssues(nodes, edges),
    ...checkVlanMixIssues(nodes, edges),
  ]
}
