import { toPng } from 'html-to-image'
import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import type { DiagramNode } from '../types/diagram'
import { downloadBlob } from '../api/client'

/** 导出用安全文件名 */
export function safeExportFilename(name: string, ext: string): string {
  const base = (name || 'project').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'project'
  const e = ext.startsWith('.') ? ext : `.${ext}`
  return base.endsWith(e) ? base : `${base}${e}`
}

export type CaptureDiagramOptions = {
  /** 输出宽度（CSS 像素），默认 1920 */
  width?: number
  /** 输出高度（CSS 像素），默认按 bounds 比例，上限 1080 */
  height?: number
  pixelRatio?: number
  backgroundColor?: string
  padding?: number
}

/**
 * 截取整张拓扑图（不限当前视口）。
 * 通过临时覆盖 .react-flow__viewport 的 transform 实现，不改动用户视口。
 */
export async function captureDiagramPng(
  nodes: DiagramNode[],
  options: CaptureDiagramOptions = {},
): Promise<string> {
  const exportable = nodes.filter((n) => n.type !== 'anchor')
  if (exportable.length === 0) {
    throw new Error('画布无设备，无法导出')
  }

  const viewportEl = document.querySelector(
    '.react-flow__viewport',
  ) as HTMLElement | null
  if (!viewportEl) {
    throw new Error('找不到画布视口，请确认已打开编辑器')
  }

  const bounds = getNodesBounds(exportable)
  const padding = options.padding ?? 40
  const pixelRatio = options.pixelRatio ?? 2
  const backgroundColor = options.backgroundColor ?? '#f8fafc'

  const contentW = Math.max(bounds.width + padding * 2, 320)
  const contentH = Math.max(bounds.height + padding * 2, 240)
  const imageWidth = options.width ?? Math.min(Math.max(Math.ceil(contentW), 800), 2400)
  const imageHeight =
    options.height ??
    Math.min(Math.max(Math.ceil((contentH / contentW) * imageWidth), 600), 1600)

  const viewport = getViewportForBounds(
    bounds,
    imageWidth,
    imageHeight,
    0.1,
    2,
    0.15,
  )

  // 导出时隐藏控件与浮层
  document.documentElement.classList.add('tvt-exporting')
  try {
    // 等一帧让 CSS 生效
    await new Promise((r) => requestAnimationFrame(() => r(undefined)))

    const dataUrl = await toPng(viewportEl, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      pixelRatio,
      cacheBust: true,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    })
    return dataUrl
  } finally {
    document.documentElement.classList.remove('tvt-exporting')
  }
}

/** 将 dataURL 下载为 PNG 文件 */
export function downloadPngDataUrl(dataUrl: string, filename: string): void {
  const bin = atob(dataUrl.split(',')[1] ?? '')
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  downloadBlob(new Blob([arr], { type: 'image/png' }), safeExportFilename(filename, '.png'))
}
