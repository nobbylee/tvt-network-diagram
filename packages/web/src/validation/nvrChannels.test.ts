import { describe, expect, it } from 'vitest'
import type { ConnectionEdge, DeviceNode, DiagramEdge } from '../types/diagram'
import { checkNvrChannelIssues } from './nvrChannels'

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
): ConnectionEdge {
  return {
    id,
    type: 'labeled',
    source,
    target,
    data: {},
  }
}

describe('checkNvrChannelIssues', () => {
  it('满通道不报错', () => {
    const nvr = device('nvr1', 'NVR-1', 'nvr', { maxChannels: 2 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const edges: DiagramEdge[] = [
      conn('e1', 'nvr1', 'ipc1'),
      conn('e2', 'nvr1', 'ipc2'),
    ]
    expect(checkNvrChannelIssues([nvr, ipc1, ipc2], edges)).toEqual([])
  })

  it('超过通道数 1 报 error', () => {
    const nvr = device('nvr1', 'NVR-1', 'nvr', { maxChannels: 2 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome')
    const ipc3 = device('ipc3', 'IPC-3', 'ipc-turret')
    const edges: DiagramEdge[] = [
      conn('e1', 'nvr1', 'ipc1'),
      conn('e2', 'ipc2', 'nvr1'),
      conn('e3', 'nvr1', 'ipc3'),
    ]
    const issues = checkNvrChannelIssues([nvr, ipc1, ipc2, ipc3], edges)
    const over = issues.find((i) => i.rule === 'nvr-channels')
    expect(over).toBeDefined()
    expect(over!.severity).toBe('error')
    expect(over!.id).toBe('nvr-channels:nvr1')
    expect(over!.nodeIds).toEqual(expect.arrayContaining(['nvr1']))
    expect(over!.message).toContain('2')
    expect(over!.message).toContain('3')
  })

  it('未填 maxChannels 出建议填写 warning', () => {
    const nvr = device('nvr1', 'NVR-1', 'nvr')
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const edges: DiagramEdge[] = [conn('e1', 'nvr1', 'ipc1')]
    const issues = checkNvrChannelIssues([nvr, ipc1], edges)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      id: 'nvr-channels-missing:nvr1',
      rule: 'nvr-channels-missing',
      severity: 'warning',
      message: '建议填写通道数',
      nodeIds: ['nvr1'],
    })
  })

  it('非摄像机对端不计通道', () => {
    const nvr = device('nvr1', 'NVR-1', 'nvr', { maxChannels: 1 })
    const sw = device('sw1', 'SW-1', 'switch')
    const ipc = device('ipc1', 'IPC-1', 'ipc-bullet')
    const edges: DiagramEdge[] = [
      conn('e1', 'nvr1', 'sw1'),
      conn('e2', 'nvr1', 'ipc'),
    ]
    expect(checkNvrChannelIssues([nvr, sw, ipc], edges)).toEqual([])
  })

  it('annotation 边不计通道', () => {
    const nvr = device('nvr1', 'NVR-1', 'nvr', { maxChannels: 1 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet')
    const ipc2 = device('ipc2', 'IPC-2', 'ptz')
    const edges: DiagramEdge[] = [
      conn('e1', 'nvr1', 'ipc1'),
      {
        id: 'a1',
        type: 'annotation',
        source: 'nvr1',
        target: 'ipc2',
        data: { kind: 'annotation' },
      },
    ]
    expect(checkNvrChannelIssues([nvr, ipc1, ipc2], edges)).toEqual([])
  })

  it('dvr 同样适用通道规则', () => {
    const dvr = device('dvr1', 'DVR-1', 'dvr', { maxChannels: 1 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-fisheye')
    const ipc2 = device('ipc2', 'IPC-2', 'ptz')
    const edges: DiagramEdge[] = [
      conn('e1', 'dvr1', 'ipc1'),
      conn('e2', 'dvr1', 'ipc2'),
    ]
    const issues = checkNvrChannelIssues([dvr, ipc1, ipc2], edges)
    expect(issues.some((i) => i.rule === 'nvr-channels')).toBe(true)
  })
})
