import { describe, expect, it } from 'vitest'
import type {
  AnnotationEdge,
  ConnectionEdge,
  DeviceNode,
  TextNode,
} from '../types/diagram'
import { diagramToNarch, narchToDiagram } from './narch'

const meta = {
  projectName: '往返测试项目',
  customer: '客户A',
  author: '测试员',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

describe('narch 1.2 往返', () => {
  it('设备带 maxChannels/poeBudgetW/ip/subnetMask 等新字段往返', () => {
    const device: DeviceNode = {
      id: 'sw1',
      type: 'device',
      position: { x: 10, y: 20 },
      data: {
        name: '核心交换机',
        brand: 'tvt',
        icon: 'switch',
        model: 'SW-24P',
        ip: '192.168.1.1',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.254',
        maxChannels: 16,
        poeBudgetW: 240,
        poePortCount: 24,
        powerDrawW: 12.5,
        mac: 'AA:BB:CC:DD:EE:FF',
        location: '机房A',
        notes: '备注',
      },
    }

    const narch = diagramToNarch([device], [], meta)
    expect(narch.version).toBe('1.2')

    const node = narch.nodes[0]
    expect(node).toMatchObject({
      id: 'sw1',
      type: 'switch',
      ip: '192.168.1.1',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.254',
      maxChannels: 16,
      poeBudgetW: 240,
      poePortCount: 24,
      powerDrawW: 12.5,
      mac: 'AA:BB:CC:DD:EE:FF',
      location: '机房A',
    })

    const { nodes } = narchToDiagram(narch)
    const back = nodes[0] as DeviceNode
    expect(back.type).toBe('device')
    expect(back.data).toMatchObject({
      name: '核心交换机',
      icon: 'switch',
      ip: '192.168.1.1',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.254',
      maxChannels: 16,
      poeBudgetW: 240,
      poePortCount: 24,
      powerDrawW: 12.5,
      mac: 'AA:BB:CC:DD:EE:FF',
      location: '机房A',
      notes: '备注',
    })
  })

  it('空字符串新字段导入为 undefined', () => {
    const { nodes } = narchToDiagram({
      version: '1.2',
      meta,
      nodes: [
        {
          id: 'd1',
          type: 'server',
          name: '设备',
          brand: 'TVT',
          ip: '',
          subnetMask: '',
          gateway: '',
          mac: '',
          location: '',
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
    })
    const data = (nodes[0] as DeviceNode).data
    expect(data.ip).toBeUndefined()
    expect(data.subnetMask).toBeUndefined()
    expect(data.gateway).toBeUndefined()
    expect(data.mac).toBeUndefined()
    expect(data.location).toBeUndefined()
  })

  it('品牌留空时保持为空，不自动补默认品牌', () => {
    const device: DeviceNode = {
      id: 'empty-brand-device',
      type: 'device',
      position: { x: 0, y: 0 },
      data: { name: '无品牌设备', icon: 'ipc-bullet' },
    }

    const narch = diagramToNarch([device], [], meta)
    expect(narch.nodes[0]).toMatchObject({ brand: '' })

    const { nodes } = narchToDiagram(narch)
    expect((nodes[0] as DeviceNode).data.brand).toBe('')
  })

  it('文本节点往返', () => {
    const text: TextNode = {
      id: 't1',
      type: 'text',
      position: { x: 100, y: 200 },
      data: { text: '机房说明', fontSize: 16, color: '#334155' },
      style: { width: 180 },
    }

    const narch = diagramToNarch([text], [], meta)
    expect(narch.nodes[0]).toMatchObject({
      id: 't1',
      type: 'text',
      text: '机房说明',
      fontSize: 16,
      color: '#334155',
      width: 180,
    })

    const { nodes } = narchToDiagram(narch)
    const back = nodes[0] as TextNode
    expect(back.type).toBe('text')
    expect(back.data).toEqual({
      text: '机房说明',
      fontSize: 16,
      color: '#334155',
    })
    expect(back.style?.width).toBe(180)
  })

  it('annotation 边往返', () => {
    const edge: AnnotationEdge = {
      id: 'a1',
      source: 'anchor1',
      target: 'anchor2',
      type: 'annotation',
      data: {
        kind: 'annotation',
        color: '#e11d48',
        strokeWidth: 3,
        label: '指向',
      },
    }

    const narch = diagramToNarch([], [edge], meta)
    expect(narch.edges[0]).toMatchObject({
      id: 'a1',
      kind: 'annotation',
      color: '#e11d48',
      strokeWidth: 3,
      label: '指向',
    })

    const { edges } = narchToDiagram(narch)
    const back = edges[0] as AnnotationEdge
    expect(back.type).toBe('annotation')
    expect(back.data).toMatchObject({
      kind: 'annotation',
      color: '#e11d48',
      strokeWidth: 3,
      label: '指向',
    })
  })

  it('connection 边 vlan/bandwidthMbps 往返', () => {
    const edge: ConnectionEdge = {
      id: 'c1',
      source: 'sw1',
      target: 'ipc1',
      type: 'labeled',
      data: {
        sourcePort: 'Gi0/1',
        targetPort: 'LAN',
        connectionType: 'PoE',
        vlan: '10',
        bandwidthMbps: 1000,
        notes: '上联',
      },
    }

    const narch = diagramToNarch([], [edge], meta)
    expect(narch.edges[0]).toMatchObject({
      id: 'c1',
      kind: 'connection',
      vlan: '10',
      bandwidthMbps: 1000,
      sourcePort: 'Gi0/1',
      connectionType: 'PoE',
    })

    const { edges } = narchToDiagram(narch)
    const back = edges[0] as ConnectionEdge
    expect(back.type).toBe('labeled')
    expect(back.data).toMatchObject({
      vlan: '10',
      bandwidthMbps: 1000,
      sourcePort: 'Gi0/1',
      targetPort: 'LAN',
      connectionType: 'PoE',
      notes: '上联',
    })
  })
})
