import { describe, expect, it } from 'vitest'
import type { ConnectionEdge, DeviceNode, DiagramEdge } from '../types/diagram'
import { checkSubnetIssues, checkVlanMixIssues } from './subnet'

/** 构造最小设备节点 */
function device(
  id: string,
  name: string,
  icon: string,
  extra?: Partial<DeviceNode['data']>,
): DeviceNode {
  return {
    id,
    type: 'device',
    position: { x: 0, y: 0 },
    data: {
      name,
      brand: '通用',
      icon,
      ...extra,
    },
  }
}

/** 构造 connection 边 */
function conn(
  id: string,
  source: string,
  target: string,
  data?: ConnectionEdge['data'],
): ConnectionEdge {
  return {
    id,
    type: 'labeled',
    source,
    target,
    data: data ?? {},
  }
}

describe('checkVlanMixIssues', () => {
  it('同一交换机多条边不同 vlan 报 warning', () => {
    const sw = device('sw1', 'SW-1', 'switch')
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const edges: DiagramEdge[] = [
      conn('e1', 'sw1', 'ipc1', { vlan: '10' }),
      conn('e2', 'sw1', 'ipc2', { vlan: '20' }),
    ]
    const issues = checkVlanMixIssues([sw, ipc1, ipc2], edges)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      id: 'vlan-mix:sw1',
      rule: 'vlan-mix',
      severity: 'warning',
      nodeIds: ['sw1'],
    })
    expect(issues[0].edgeIds).toEqual(expect.arrayContaining(['e1', 'e2']))
  })

  it('同一交换机相同 vlan 不报', () => {
    const sw = device('sw1', 'SW-1', 'switch')
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const edges: DiagramEdge[] = [
      conn('e1', 'sw1', 'ipc1', { vlan: '10' }),
      conn('e2', 'sw1', 'ipc2', { vlan: '10' }),
    ]
    expect(checkVlanMixIssues([sw, ipc1, ipc2], edges)).toEqual([])
  })

  it('未填 vlan 的边不参与混用判断', () => {
    const sw = device('sw1', 'SW-1', 'switch')
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const edges: DiagramEdge[] = [
      conn('e1', 'sw1', 'ipc1', { vlan: '10' }),
      conn('e2', 'sw1', 'ipc2', {}),
    ]
    expect(checkVlanMixIssues([sw, ipc1, ipc2], edges)).toEqual([])
  })
})

describe('checkSubnetIssues', () => {
  it('直连两端网络号不同报 ip-subnet warning', () => {
    const a = device('a', 'A', 'ipc-bullet', {
      ip: '192.168.1.10',
      subnetMask: '255.255.255.0',
    })
    const b = device('b', 'B', 'ipc-dome', {
      ip: '192.168.2.10',
      subnetMask: '/24',
    })
    const edges: DiagramEdge[] = [conn('e1', 'a', 'b')]
    const issues = checkSubnetIssues([a, b], edges)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      rule: 'ip-subnet',
      severity: 'warning',
    })
    expect(issues[0].nodeIds).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('都直连同一交换机且网段不同报 warning', () => {
    const sw = device('sw1', 'SW-1', 'switch')
    const a = device('a', 'A', 'ipc-bullet', {
      ip: '10.0.0.1',
      subnetMask: '/24',
    })
    const b = device('b', 'B', 'ipc-dome', {
      ip: '10.0.1.1',
      subnetMask: '255.255.255.0',
    })
    const edges: DiagramEdge[] = [
      conn('e1', 'sw1', 'a'),
      conn('e2', 'sw1', 'b'),
    ]
    const issues = checkSubnetIssues([sw, a, b], edges)
    const subnet = issues.find((i) => i.rule === 'ip-subnet')
    expect(subnet).toBeDefined()
    expect(subnet!.nodeIds).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('同网段不报', () => {
    const a = device('a', 'A', 'ipc-bullet', {
      ip: '192.168.1.10',
      subnetMask: '/24',
    })
    const b = device('b', 'B', 'ipc-dome', {
      ip: '192.168.1.20',
      subnetMask: '255.255.255.0',
    })
    const edges: DiagramEdge[] = [conn('e1', 'a', 'b')]
    expect(checkSubnetIssues([a, b], edges)).toEqual([])
  })

  it('缺掩码则跳过', () => {
    const a = device('a', 'A', 'ipc-bullet', { ip: '192.168.1.10' })
    const b = device('b', 'B', 'ipc-dome', {
      ip: '192.168.2.10',
      subnetMask: '/24',
    })
    const edges: DiagramEdge[] = [conn('e1', 'a', 'b')]
    expect(checkSubnetIssues([a, b], edges)).toEqual([])
  })
})
