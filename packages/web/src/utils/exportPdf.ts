import { jsPDF } from 'jspdf'
import { iconOptions } from '../data/deviceLibrary'
import type { DiagramEdge, DiagramNode, DeviceNode } from '../types/diagram'
import { downloadBlob } from '../api/client'
import { safeExportFilename } from './exportImage'

export type ExportPdfMeta = {
  projectName: string
  customer?: string
  author?: string
  /** 拓扑图 PNG dataURL */
  diagramDataUrl: string
}

const CONN_COLORS: Record<string, string> = {
  网线: '#0066cc',
  光纤: '#ca8a04',
  PoE: '#16a34a',
  WiFi: '#7c3aed',
  '4G': '#ea580c',
}

function iconLabel(icon: string): string {
  return iconOptions.find((o) => o.value === icon)?.label ?? icon
}

function collectDeviceIcons(nodes: DiagramNode[]): string[] {
  const set = new Set<string>()
  for (const n of nodes) {
    if (n.type !== 'device') continue
    set.add(String((n as DeviceNode).data.icon ?? 'server'))
  }
  return [...set]
}

function collectConnectionTypes(edges: DiagramEdge[]): string[] {
  const set = new Set<string>()
  for (const e of edges) {
    if (e.type === 'annotation') continue
    const t = e.data && 'connectionType' in e.data ? e.data.connectionType : undefined
    if (t) set.add(String(t))
  }
  return [...set]
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function formatDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 在 Canvas 上合成：顶栏标题 + 拓扑图 + 底栏图签 + 右侧图例，再输出 PDF。
 * 中文全部用 Canvas 绘制，避免 jsPDF 缺字。
 */
export async function exportDiagramPdf(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  meta: ExportPdfMeta,
): Promise<void> {
  const pageW = 1754 // ~A4 横向 @150dpi 宽
  const pageH = 1240
  const margin = 36
  const titleH = 52
  const titleBlock = 28
  const legendW = 200
  const stampH = 72

  const canvas = document.createElement('canvas')
  canvas.width = pageW
  canvas.height = pageH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pageW, pageH)

  // 顶栏
  ctx.fillStyle = '#2f5d50'
  ctx.fillRect(0, 0, pageW, titleH)
  ctx.fillStyle = '#fbf8f1'
  ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('TVT 网络架构图', margin, 34)

  const diagramTop = titleH + titleBlock
  const diagramLeft = margin
  const diagramRight = pageW - margin - legendW - 16
  const diagramBottom = pageH - stampH - margin
  const diagramW = diagramRight - diagramLeft
  const diagramH = diagramBottom - diagramTop

  // 项目副标题
  ctx.fillStyle = '#1c2838'
  ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif'
  const subtitle = meta.projectName || '未命名项目'
  ctx.fillText(subtitle, margin, titleH + 20)

  // 拓扑图区域底色
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(diagramLeft, diagramTop, diagramW, diagramH)
  ctx.strokeStyle = '#d5cfc2'
  ctx.lineWidth = 1
  ctx.strokeRect(diagramLeft, diagramTop, diagramW, diagramH)

  const diagramImg = await loadImage(meta.diagramDataUrl)
  const scale = Math.min(diagramW / diagramImg.width, diagramH / diagramImg.height)
  const dw = diagramImg.width * scale
  const dh = diagramImg.height * scale
  const dx = diagramLeft + (diagramW - dw) / 2
  const dy = diagramTop + (diagramH - dh) / 2
  ctx.drawImage(diagramImg, dx, dy, dw, dh)

  // 右侧图例
  const legendX = diagramRight + 16
  let legendY = diagramTop
  ctx.fillStyle = '#1c2838'
  ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('图例', legendX, legendY + 14)
  legendY += 28

  const icons = collectDeviceIcons(nodes)
  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif'
  for (const icon of icons) {
    ctx.fillStyle = '#2f5d50'
    ctx.fillRect(legendX, legendY, 16, 16)
    ctx.fillStyle = '#1c2838'
    ctx.fillText(iconLabel(icon), legendX + 28, legendY + 13)
    legendY += 28
    if (legendY > diagramBottom - 80) break
  }

  const connTypes = collectConnectionTypes(edges)
  if (connTypes.length > 0 && legendY < diagramBottom - 40) {
    legendY += 8
    ctx.fillStyle = '#1c2838'
    ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText('连接类型', legendX, legendY + 14)
    legendY += 28
    ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif'
    for (const t of connTypes) {
      ctx.strokeStyle = CONN_COLORS[t] ?? '#64748b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(legendX, legendY + 8)
      ctx.lineTo(legendX + 22, legendY + 8)
      ctx.stroke()
      ctx.fillStyle = '#1c2838'
      ctx.fillText(t, legendX + 28, legendY + 12)
      legendY += 24
    }
  }

  // 底栏图签
  const stampY = pageH - stampH
  ctx.fillStyle = '#e7e1d4'
  ctx.fillRect(0, stampY, pageW, stampH)
  ctx.strokeStyle = '#d5cfc2'
  ctx.beginPath()
  ctx.moveTo(0, stampY)
  ctx.lineTo(pageW, stampY)
  ctx.stroke()

  const cells: [string, string][] = [
    ['项目名称', meta.projectName || '未命名项目'],
    ['客户', meta.customer?.trim() || '—'],
    ['编制人', meta.author?.trim() || '—'],
    ['日期', formatDate()],
  ]
  const cellW = pageW / cells.length
  ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif'
  cells.forEach(([label, value], i) => {
    const x = i * cellW + 16
    ctx.fillStyle = '#5a6574'
    ctx.fillText(label, x, stampY + 24)
    ctx.fillStyle = '#1c2838'
    ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
    const truncated =
      value.length > 22 ? `${value.slice(0, 22)}…` : value
    ctx.fillText(truncated, x, stampY + 48)
    ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif'
    if (i > 0) {
      ctx.strokeStyle = '#d5cfc2'
      ctx.beginPath()
      ctx.moveTo(i * cellW, stampY + 8)
      ctx.lineTo(i * cellW, pageH - 8)
      ctx.stroke()
    }
  })

  const dataUrl = canvas.toDataURL('image/png', 1)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()
  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH)

  const blob = pdf.output('blob')
  downloadBlob(blob, safeExportFilename(meta.projectName || 'project', '.pdf'))
}
