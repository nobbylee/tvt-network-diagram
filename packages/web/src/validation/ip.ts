import type { DeviceNode, DiagramNode } from '../types/diagram'
import type { ValidationIssue } from './types'

/** 规范化 IP：去首尾空白 */
export function normalizeIp(raw: string): string {
  return raw.trim()
}

/** 解析 IPv4，成功返回四段数字，失败返回 null */
export function parseIPv4(raw: string): [number, number, number, number] | null {
  const s = normalizeIp(raw)
  const parts = s.split('.')
  if (parts.length !== 4) return null
  const nums: number[] = []
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null
    const n = Number(p)
    if (!Number.isInteger(n) || n < 0 || n > 255) return null
    // 禁止前导零（如 01），但允许单独的 0
    if (p.length > 1 && p.startsWith('0')) return null
    nums.push(n)
  }
  return nums as [number, number, number, number]
}

/** 将四段转为 32 位无符号整数 */
function octetsToInt(octets: [number, number, number, number]): number {
  return (
    ((octets[0] << 24) >>> 0) +
    ((octets[1] << 16) >>> 0) +
    ((octets[2] << 8) >>> 0) +
    (octets[3] >>> 0)
  ) >>> 0
}

/**
 * 解析子网掩码：支持 `255.255.255.0` 或 `/24`。
 * 成功返回前缀长度 0–32，失败返回 null。
 */
export function parseMask(raw: string): number | null {
  const s = normalizeIp(raw)
  if (s.startsWith('/')) {
    const n = Number(s.slice(1))
    if (!Number.isInteger(n) || n < 0 || n > 32) return null
    return n
  }
  const octets = parseIPv4(s)
  if (octets == null) return null
  const mask = octetsToInt(octets)
  // 掩码必须是连续 1 后跟连续 0
  if (mask === 0) return 0
  const inverted = (~mask) >>> 0
  if ((inverted & (inverted + 1)) !== 0) return null
  // 统计前缀长度
  let prefix = 0
  let m = mask
  while (m & 0x80000000) {
    prefix++
    m = (m << 1) >>> 0
  }
  if (m !== 0) return null
  return prefix
}

/**
 * 计算网络号（点分十进制）。IP 或掩码非法时返回 null。
 */
export function networkAddress(ip: string, mask: string): string | null {
  const octets = parseIPv4(ip)
  const prefix = parseMask(mask)
  if (octets == null || prefix == null) return null
  const ipInt = octetsToInt(octets)
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const net = (ipInt & maskInt) >>> 0
  return [
    (net >>> 24) & 0xff,
    (net >>> 16) & 0xff,
    (net >>> 8) & 0xff,
    net & 0xff,
  ].join('.')
}

function isDeviceNode(node: DiagramNode): node is DeviceNode {
  return node.type === 'device'
}

/**
 * 检查设备节点的 IP 格式与冲突问题。
 * 空 IP 跳过；非法格式 warning；相同 IP 冲突 error。
 */
export function checkIpIssues(nodes: DiagramNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  /** 规范化 IP → 使用该 IP 的设备列表 */
  const byIp = new Map<string, DeviceNode[]>()

  for (const node of nodes) {
    if (!isDeviceNode(node)) continue
    const raw = node.data.ip
    if (raw == null) continue
    const normalized = normalizeIp(raw)
    if (normalized === '') continue

    if (parseIPv4(normalized) == null) {
      issues.push({
        id: `ip-format:${node.id}`,
        rule: 'ip-format',
        severity: 'warning',
        message: `「${node.data.name}」的 IP「${normalized}」格式无效`,
        nodeIds: [node.id],
      })
      continue
    }

    const list = byIp.get(normalized) ?? []
    list.push(node)
    byIp.set(normalized, list)
  }

  for (const [ip, group] of byIp) {
    if (group.length < 2) continue
    const names = group.map((n) => `「${n.data.name}」`).join('')
    issues.push({
      id: `ip-conflict:${ip}`,
      rule: 'ip-conflict',
      severity: 'error',
      message: `IP ${ip} 被${names}重复使用`,
      nodeIds: group.map((n) => n.id),
    })
  }

  return issues
}
