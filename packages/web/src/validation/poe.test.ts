import { describe, expect, it } from 'vitest'
import type { ConnectionEdge, DeviceNode, DiagramEdge } from '../types/diagram'
import { checkPoeIssues } from './poe'

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

/** 构造 PoE connection 边 */
function poeEdge(
  id: string,
  source: string,
  target: string,
): ConnectionEdge {
  return {
    id,
    type: 'labeled',
    source,
    target,
    data: { connectionType: 'PoE' },
  }
}

describe('checkPoeIssues', () => {
  it('超预算报 poe-budget error', () => {
    const sw = device('sw1', 'SW-1', 'switch', { poeBudgetW: 10 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet', { powerDrawW: 6 })
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome', { powerDrawW: 6 })
    const edges: DiagramEdge[] = [
      poeEdge('e1', 'sw1', 'ipc1'),
      poeEdge('e2', 'sw1', 'ipc2'),
    ]
    const issues = checkPoeIssues([sw, ipc1, ipc2], edges)
    const budget = issues.find((i) => i.rule === 'poe-budget')
    expect(budget).toBeDefined()
    expect(budget!.severity).toBe('error')
    expect(budget!.id).toBe('poe-budget:sw1')
    expect(budget!.nodeIds).toEqual(expect.arrayContaining(['sw1']))
  })

  it('超过 80% 未超预算报 poe-headroom warning', () => {
    const sw = device('sw1', 'SW-1', 'switch', { poeBudgetW: 20 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet', { powerDrawW: 10 })
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome', { powerDrawW: 8 })
    const edges: DiagramEdge[] = [
      poeEdge('e1', 'sw1', 'ipc1'),
      poeEdge('e2', 'sw1', 'ipc2'),
    ]
    const issues = checkPoeIssues([sw, ipc1, ipc2], edges)
    expect(issues.find((i) => i.rule === 'poe-budget')).toBeUndefined()
    const headroom = issues.find((i) => i.rule === 'poe-headroom')
    expect(headroom).toBeDefined()
    expect(headroom!.severity).toBe('warning')
    expect(headroom!.id).toBe('poe-headroom:sw1')
  })

  it('使用默认功耗时 estimated 为 true', () => {
    // 预算 15W，两路默认 7W = 14W，未超但 >80%（12W）
    const sw = device('sw1', 'SW-1', 'switch', { poeBudgetW: 15 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const edges: DiagramEdge[] = [
      poeEdge('e1', 'sw1', 'ipc1'),
      poeEdge('e2', 'sw1', 'ipc2'),
    ]
    const issues = checkPoeIssues([sw, ipc1, ipc2], edges)
    const headroom = issues.find((i) => i.rule === 'poe-headroom')
    expect(headroom).toBeDefined()
    expect(headroom!.estimated).toBe(true)
    expect(headroom!.message).toMatch(/默认功耗/)
  })

  it('PoE 边数超过口数报 poe-ports error', () => {
    const sw = device('sw1', 'SW-1', 'switch', {
      poeBudgetW: 100,
      poePortCount: 1,
    })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet', { powerDrawW: 5 })
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome', { powerDrawW: 5 })
    const edges: DiagramEdge[] = [
      poeEdge('e1', 'sw1', 'ipc1'),
      poeEdge('e2', 'sw1', 'ipc2'),
    ]
    const issues = checkPoeIssues([sw, ipc1, ipc2], edges)
    const ports = issues.find((i) => i.rule === 'poe-ports')
    expect(ports).toBeDefined()
    expect(ports!.severity).toBe('error')
    expect(ports!.id).toBe('poe-ports:sw1')
  })

  it('未填预算跳过预算规则，仍可检口数', () => {
    const sw = device('sw1', 'SW-1', 'switch', { poePortCount: 1 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const edges: DiagramEdge[] = [
      poeEdge('e1', 'sw1', 'ipc1'),
      poeEdge('e2', 'sw1', 'ipc2'),
    ]
    const issues = checkPoeIssues([sw, ipc1, ipc2], edges)
    expect(issues.find((i) => i.rule === 'poe-budget')).toBeUndefined()
    expect(issues.find((i) => i.rule === 'poe-headroom')).toBeUndefined()
    expect(issues.find((i) => i.rule === 'poe-ports')).toBeDefined()
  })

  it('无法估算功耗的边出 poe-unestimated warning 且不计入瓦数', () => {
    const sw = device('sw1', 'SW-1', 'switch', { poeBudgetW: 10 })
    const unknown = device('u1', '未知设备', 'router')
    const edges: DiagramEdge[] = [poeEdge('e1', 'sw1', 'u1')]
    const issues = checkPoeIssues([sw, unknown], edges)
    const unest = issues.find((i) => i.rule === 'poe-unestimated')
    expect(unest).toBeDefined()
    expect(unest!.severity).toBe('warning')
    expect(unest!.edgeIds).toEqual(expect.arrayContaining(['e1']))
    expect(issues.find((i) => i.rule === 'poe-budget')).toBeUndefined()
  })

  it('非 PoE 边不计入预算', () => {
    const sw = device('sw1', 'SW-1', 'switch', { poeBudgetW: 5 })
    const ipc = device('ipc1', 'IPC-1', 'ipc-bullet', { powerDrawW: 20 })
    const edges: DiagramEdge[] = [
      {
        id: 'e1',
        type: 'labeled',
        source: 'sw1',
        target: 'ipc1',
        data: { connectionType: '网线' },
      },
    ]
    expect(checkPoeIssues([sw, ipc], edges)).toEqual([])
  })
})
