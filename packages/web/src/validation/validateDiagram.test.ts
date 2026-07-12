import { describe, expect, it } from 'vitest'
import type { ConnectionEdge, DeviceNode, DiagramEdge } from '../types/diagram'
import { validateDiagram } from './validateDiagram'

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

describe('validateDiagram', () => {
  it('按顺序汇总 ip → nvr → poe → vlan', () => {
    const nvr = device('nvr1', 'NVR-1', 'nvr', { maxChannels: 1 })
    const sw = device('sw1', 'SW-1', 'switch', { poeBudgetW: 5 })
    const ipc1 = device('ipc1', 'IPC-1', 'ipc-bullet', {
      ip: '192.168.1.10',
      powerDrawW: 4,
    })
    const ipc2 = device('ipc2', 'IPC-2', 'ipc-dome', {
      ip: '192.168.1.10',
      powerDrawW: 4,
    })
    const ipc3 = device('ipc3', 'IPC-3', 'ipc-turret')
    const nodes = [nvr, sw, ipc1, ipc2, ipc3]
    const edges: DiagramEdge[] = [
      conn('e-nvr-1', 'nvr1', 'ipc1'),
      conn('e-nvr-2', 'nvr1', 'ipc2'),
      conn('e-poe-1', 'sw1', 'ipc1', { connectionType: 'PoE' }),
      conn('e-poe-2', 'sw1', 'ipc2', { connectionType: 'PoE' }),
      conn('e-vlan-1', 'sw1', 'ipc1', { vlan: '10' }),
      conn('e-vlan-2', 'sw1', 'ipc3', { vlan: '20' }),
    ]

    const issues = validateDiagram(nodes, edges)
    const rules = issues.map((i) => i.rule)

    // IP 冲突应在最前
    const ipIdx = rules.indexOf('ip-conflict')
    const nvrIdx = rules.indexOf('nvr-channels')
    const poeIdx = rules.indexOf('poe-budget')
    const vlanIdx = rules.indexOf('vlan-mix')

    expect(ipIdx).toBeGreaterThanOrEqual(0)
    expect(nvrIdx).toBeGreaterThan(ipIdx)
    expect(poeIdx).toBeGreaterThan(nvrIdx)
    expect(vlanIdx).toBeGreaterThan(poeIdx)
  })

  it('空图无问题', () => {
    expect(validateDiagram([], [])).toEqual([])
  })
})
