import { describe, expect, it } from 'vitest'
import type { DeviceNode } from '../types/diagram'
import {
  checkIpIssues,
  networkAddress,
  normalizeIp,
  parseIPv4,
  parseMask,
} from './ip'

/** 构造最小设备节点，便于单测 */
function device(
  id: string,
  name: string,
  ip?: string,
): DeviceNode {
  return {
    id,
    type: 'device',
    position: { x: 0, y: 0 },
    data: {
      name,
      brand: '通用',
      icon: 'ipc-bullet',
      ip,
    },
  }
}

describe('normalizeIp', () => {
  it('去除首尾空格', () => {
    expect(normalizeIp('  192.168.1.10  ')).toBe('192.168.1.10')
  })
})

describe('parseIPv4', () => {
  it('解析合法 IPv4', () => {
    expect(parseIPv4('192.168.1.10')).toEqual([192, 168, 1, 10])
  })

  it('非法格式返回 null', () => {
    expect(parseIPv4('192.168.1')).toBeNull()
    expect(parseIPv4('999.1.1.1')).toBeNull()
    expect(parseIPv4('abc')).toBeNull()
  })
})

describe('checkIpIssues', () => {
  it('相同 IP 冲突报 error', () => {
    const nodes = [
      device('n1', 'IPC-1', '192.168.1.10'),
      device('n2', 'IPC-2', '192.168.1.10'),
    ]
    const issues = checkIpIssues(nodes)
    const conflict = issues.find((i) => i.rule === 'ip-conflict')
    expect(conflict).toBeDefined()
    expect(conflict!.severity).toBe('error')
    expect(conflict!.id).toBe('ip-conflict:192.168.1.10')
    expect(conflict!.nodeIds).toEqual(expect.arrayContaining(['n1', 'n2']))
    expect(conflict!.message).toBe(
      'IP 192.168.1.10 被「IPC-1」「IPC-2」重复使用',
    )
  })

  it('空 IP 跳过，不产生问题', () => {
    const nodes = [
      device('n1', 'IPC-1', ''),
      device('n2', 'IPC-2', undefined),
      device('n3', 'IPC-3', '   '),
    ]
    expect(checkIpIssues(nodes)).toEqual([])
  })

  it('非法格式报 warning', () => {
    const nodes = [device('n1', 'IPC-1', 'not-an-ip')]
    const issues = checkIpIssues(nodes)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      id: 'ip-format:n1',
      rule: 'ip-format',
      severity: 'warning',
      nodeIds: ['n1'],
    })
    expect(issues[0].message).toContain('IPC-1')
  })

  it('带空格的相同 IP 经规范化后仍冲突', () => {
    const nodes = [
      device('n1', 'IPC-1', ' 192.168.1.10'),
      device('n2', 'IPC-2', '192.168.1.10 '),
    ]
    const issues = checkIpIssues(nodes)
    const conflict = issues.find((i) => i.rule === 'ip-conflict')
    expect(conflict?.id).toBe('ip-conflict:192.168.1.10')
  })
})

describe('parseMask', () => {
  it('解析点分掩码与 CIDR', () => {
    expect(parseMask('255.255.255.0')).toBe(24)
    expect(parseMask('/24')).toBe(24)
    expect(parseMask('255.255.0.0')).toBe(16)
  })

  it('非法掩码返回 null', () => {
    expect(parseMask('255.0.255.0')).toBeNull()
    expect(parseMask('/33')).toBeNull()
    expect(parseMask('abc')).toBeNull()
  })
})

describe('networkAddress', () => {
  it('计算网络号', () => {
    expect(networkAddress('192.168.1.10', '255.255.255.0')).toBe('192.168.1.0')
    expect(networkAddress('10.0.5.20', '/16')).toBe('10.0.0.0')
  })
})
