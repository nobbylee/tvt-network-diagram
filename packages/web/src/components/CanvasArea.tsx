import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  ViewportPortal,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DeviceNodeView } from '../nodes/DeviceNode'
import { TextNodeView } from '../nodes/TextNode'
import { AnchorNodeView } from '../nodes/AnchorNode'
import { LabeledEdge } from '../edges/LabeledEdge'
import { AnnotationEdgeView } from '../edges/AnnotationEdge'
import { SnapGuideLine } from './SnapGuideLine'
import { useCanvasStore } from '../stores/canvasStore'
import { useUiStore } from '../stores/uiStore'
import { useValidationStore } from '../stores/validationStore'
import type { DeviceItem } from '../data/deviceLibrary'
import { snapPointToDevice } from '../utils/snap'

const nodeTypes: NodeTypes = {
  device: DeviceNodeView,
  text: TextNodeView,
  anchor: AnchorNodeView,
}

const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
  annotation: AnnotationEdgeView,
}

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [dropActive, setDropActive] = useState(false)
  const arrowStartRef = useRef<{
    x: number
    y: number
    attachedTo?: string
  } | null>(null)
  const [arrowStarted, setArrowStarted] = useState(false)
  const [arrowPreview, setArrowPreview] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)

  const {
    screenToFlowPosition,
    zoomIn,
    zoomOut,
    setViewport,
    getViewport,
    setCenter,
    getZoom,
    getNode,
  } = useReactFlow()

  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const snapGuide = useCanvasStore((s) => s.snapGuide)
  const onNodesChange = useCanvasStore((s) => s.onNodesChange)
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange)
  const onConnect = useCanvasStore((s) => s.onConnect)
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId)
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId)
  const setZoomPercent = useCanvasStore((s) => s.setZoomPercent)
  const addDeviceNode = useCanvasStore((s) => s.addDeviceNode)
  const addTextNode = useCanvasStore((s) => s.addTextNode)
  const addAnnotationArrow = useCanvasStore((s) => s.addAnnotationArrow)
  const deleteSelected = useCanvasStore((s) => s.deleteSelected)
  const copySelected = useCanvasStore((s) => s.copySelected)
  const pasteClipboard = useCanvasStore((s) => s.pasteClipboard)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)

  const focusTarget = useValidationStore((s) => s.focusTarget)
  const clearFocus = useValidationStore((s) => s.clearFocus)

  // 响应校验面板「定位」请求
  useEffect(() => {
    if (!focusTarget) return
    const zoom = Math.max(getZoom(), 0.8)
    if (focusTarget.nodeId) {
      setSelectedNodeId(focusTarget.nodeId)
      const node = getNode(focusTarget.nodeId)
      if (node) {
        const w = typeof node.measured?.width === 'number' ? node.measured.width : 160
        const h = typeof node.measured?.height === 'number' ? node.measured.height : 80
        setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom, duration: 280 })
      }
    } else if (focusTarget.edgeId) {
      setSelectedEdgeId(focusTarget.edgeId)
      const edge = edges.find((e) => e.id === focusTarget.edgeId)
      if (edge) {
        const src = getNode(edge.source)
        if (src) {
          const w = typeof src.measured?.width === 'number' ? src.measured.width : 160
          const h = typeof src.measured?.height === 'number' ? src.measured.height : 80
          setCenter(src.position.x + w / 2, src.position.y + h / 2, { zoom, duration: 280 })
        }
      }
    }
    clearFocus()
  }, [
    focusTarget,
    clearFocus,
    setSelectedNodeId,
    setSelectedEdgeId,
    getNode,
    getZoom,
    setCenter,
    edges,
  ])

  const isDraggingDevice = useUiStore((s) => s.isDraggingDevice)
  const setDraggingDevice = useUiStore((s) => s.setDraggingDevice)
  const canvasTool = useUiStore((s) => s.canvasTool)
  const setCanvasTool = useUiStore((s) => s.setCanvasTool)

  const deviceCount = nodes.filter((n) => n.type === 'device').length
  const connectionCount = edges.filter((e) => e.type !== 'annotation').length

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      if (selectedNodes.length > 0) {
        setSelectedNodeId(selectedNodes[0].id)
        return
      }
      if (selectedEdges.length > 0) {
        setSelectedEdgeId(selectedEdges[0].id)
        return
      }
      setSelectedNodeId(null)
      setSelectedEdgeId(null)
    },
    [setSelectedNodeId, setSelectedEdgeId],
  )

  const onMoveEnd = useCallback(() => {
    const { zoom } = getViewport()
    setZoomPercent(zoom * 100)
  }, [getViewport, setZoomPercent])

  useEffect(() => {
    const onZoomIn = () => {
      void zoomIn({ duration: 150 })
      setTimeout(() => {
        const { zoom } = getViewport()
        setZoomPercent(zoom * 100)
      }, 160)
    }
    const onZoomOut = () => {
      void zoomOut({ duration: 150 })
      setTimeout(() => {
        const { zoom } = getViewport()
        setZoomPercent(zoom * 100)
      }, 160)
    }
    const onZoomReset = () => {
      void setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 150 })
      setZoomPercent(100)
    }

    window.addEventListener('tvt-zoom-in', onZoomIn)
    window.addEventListener('tvt-zoom-out', onZoomOut)
    window.addEventListener('tvt-zoom-reset', onZoomReset)
    return () => {
      window.removeEventListener('tvt-zoom-in', onZoomIn)
      window.removeEventListener('tvt-zoom-out', onZoomOut)
      window.removeEventListener('tvt-zoom-reset', onZoomReset)
    }
  }, [zoomIn, zoomOut, setViewport, getViewport, setZoomPercent])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (meta && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        copySelected()
        return
      }
      if (meta && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        pasteClipboard()
        return
      }
      if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (copySelected()) pasteClipboard()
        return
      }
      if (e.key === 'Escape') {
        arrowStartRef.current = null
        setArrowStarted(false)
        setArrowPreview(null)
        setCanvasTool('select')
        return
      }
      if (!meta && e.key.toLowerCase() === 'v') {
        setCanvasTool('select')
        return
      }
      if (!meta && e.key.toLowerCase() === 't') {
        setCanvasTool('text')
        return
      }
      if (!meta && e.key.toLowerCase() === 'a') {
        setCanvasTool('arrow')
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, deleteSelected, copySelected, pasteClipboard, setCanvasTool])

  // 切换工具时清空箭头草稿
  useEffect(() => {
    arrowStartRef.current = null
    setArrowStarted(false)
    setArrowPreview(null)
  }, [canvasTool])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropActive(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent) => {
    if (event.currentTarget === event.target) {
      setDropActive(false)
    }
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDropActive(false)
      setDraggingDevice(false)

      const raw = event.dataTransfer.getData('application/tvt-device')
      if (!raw) return

      let item: DeviceItem
      try {
        item = JSON.parse(raw) as DeviceItem
      } catch {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addDeviceNode({
        name: item.name,
        brand: item.brand,
        icon: item.icon,
        position,
      })
      setCanvasTool('select')
    },
    [screenToFlowPosition, addDeviceNode, setDraggingDevice, setCanvasTool],
  )

  const resolvePoint = useCallback(
    (clientX: number, clientY: number) => {
      const raw = screenToFlowPosition({ x: clientX, y: clientY })
      const { point, nodeId } = snapPointToDevice(raw, nodes)
      return { point, attachedTo: nodeId ?? undefined }
    },
    [screenToFlowPosition, nodes],
  )

  const placeArrowPoint = useCallback(
    (clientX: number, clientY: number) => {
      const { point, attachedTo } = resolvePoint(clientX, clientY)
      if (!arrowStartRef.current) {
        arrowStartRef.current = { ...point, attachedTo }
        setArrowStarted(true)
        setArrowPreview({ x1: point.x, y1: point.y, x2: point.x, y2: point.y })
        return
      }
      const start = arrowStartRef.current
      if (Math.hypot(point.x - start.x, point.y - start.y) < 8) {
        arrowStartRef.current = null
        setArrowStarted(false)
        setArrowPreview(null)
        return
      }
      addAnnotationArrow(
        { x: start.x, y: start.y },
        point,
        { startAttachedTo: start.attachedTo, endAttachedTo: attachedTo },
      )
      arrowStartRef.current = null
      setArrowStarted(false)
      setArrowPreview(null)
      setCanvasTool('select')
    },
    [resolvePoint, addAnnotationArrow, setCanvasTool],
  )

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (canvasTool === 'text') {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
        addTextNode(position)
        setCanvasTool('select')
        return
      }

      if (canvasTool === 'arrow') {
        placeArrowPoint(event.clientX, event.clientY)
      }
    },
    [
      canvasTool,
      screenToFlowPosition,
      addTextNode,
      setCanvasTool,
      placeArrowPoint,
    ],
  )

  const onNodeClick = useCallback(
    (event: React.MouseEvent, _node: { id: string }) => {
      if (canvasTool === 'text') {
        event.stopPropagation()
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
        addTextNode(position)
        setCanvasTool('select')
        return
      }
      if (canvasTool === 'arrow') {
        event.stopPropagation()
        placeArrowPoint(event.clientX, event.clientY)
      }
    },
    [canvasTool, screenToFlowPosition, addTextNode, setCanvasTool, placeArrowPoint],
  )

  const onPaneMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (canvasTool !== 'arrow' || !arrowStartRef.current) return
      const { point } = resolvePoint(event.clientX, event.clientY)
      setArrowPreview({
        x1: arrowStartRef.current.x,
        y1: arrowStartRef.current.y,
        x2: point.x,
        y2: point.y,
      })
    },
    [canvasTool, resolvePoint],
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'labeled' as const,
    }),
    [],
  )

  const showDropHint = isDraggingDevice || dropActive
  const isAnnotating = canvasTool === 'text' || canvasTool === 'arrow'

  return (
    <div
      ref={reactFlowWrapper}
      className="relative h-full w-full"
      onDragLeave={onDragLeave}
      onMouseMove={onPaneMouseMove}
      style={{
        cursor:
          canvasTool === 'text'
            ? 'text'
            : canvasTool === 'arrow'
              ? 'crosshair'
              : undefined,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onMoveEnd={onMoveEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2}
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={null}
        panOnScroll
        panOnDrag={isAnnotating ? false : [1, 2]}
        selectionOnDrag={!isAnnotating}
        nodesDraggable={canvasTool === 'select'}
        nodesConnectable={canvasTool === 'select'}
        elementsSelectable={canvasTool === 'select'}
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          id="dots"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--canvas-grid)"
        />
        <Controls
          showInteractive={false}
          className="!overflow-hidden !rounded-[var(--radius-sm)] !border !shadow-none"
          style={{
            borderColor: 'var(--panel-border)',
            background: 'var(--panel-bg)',
          }}
        />
        <MiniMap
          pannable
          zoomable
          className="!overflow-hidden !rounded-[var(--radius-sm)] !border"
          style={{
            borderColor: 'var(--panel-border)',
            background: 'var(--panel-bg)',
          }}
          nodeColor={(n) => {
            if (n.type === 'text') return '#94a3b8'
            if (n.type === 'anchor') return '#e11d48'
            return '#0066cc'
          }}
          maskColor="rgba(15, 23, 42, 0.08)"
        />
        {snapGuide && <SnapGuideLine guide={snapGuide} />}
        {arrowPreview && (
          <ViewportPortal>
            <svg
              className="pointer-events-none overflow-visible"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                overflow: 'visible',
                zIndex: 6,
              }}
            >
              <defs>
                <marker
                  id="tvt-preview-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
                </marker>
              </defs>
              <line
                x1={arrowPreview.x1}
                y1={arrowPreview.y1}
                x2={arrowPreview.x2}
                y2={arrowPreview.y2}
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="4 3"
                markerEnd="url(#tvt-preview-arrow)"
              />
            </svg>
          </ViewportPortal>
        )}
      </ReactFlow>

      {canvasTool === 'arrow' && (
        <div className="tvt-canvas-overlay pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-[var(--radius-sm)] border bg-[var(--panel-bg)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-sm"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {arrowStarted
            ? '再点一下确定箭头终点（靠近设备会吸附）· Esc 取消'
            : '点击画布或设备确定箭头起点'}
        </div>
      )}

      {canvasTool === 'text' && (
        <div className="tvt-canvas-overlay pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-[var(--radius-sm)] border bg-[var(--panel-bg)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-sm"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          点击画布放置文本框 · Esc 取消
        </div>
      )}

      {showDropHint && (
        <div className="tvt-canvas-overlay pointer-events-none absolute inset-3 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)]/40">
          <div className="flex h-full items-center justify-center">
            <span className="rounded-[var(--radius-sm)] bg-[var(--panel-bg)] px-3 py-1.5 text-xs text-[var(--accent)] shadow-sm">
              松开鼠标放置设备
            </span>
          </div>
        </div>
      )}

      {deviceCount === 0 && !showDropHint && canvasTool === 'select' && (
        <div className="tvt-canvas-overlay pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="max-w-xs rounded-[var(--radius-md)] border px-5 py-4 text-center"
            style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
          >
            <p className="text-sm text-[var(--text-primary)]">画布为空</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              从左侧元件库拖入设备，或用工具栏添加文本 / 箭头标注
            </p>
          </div>
        </div>
      )}

      <div
        className="tvt-canvas-overlay pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-1.5 text-[10px] text-[var(--text-muted)]"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
      >
        <span>{deviceCount} 个设备</span>
        <span>·</span>
        <span>{connectionCount} 条连线</span>
      </div>
    </div>
  )
}

export function CanvasArea() {
  return (
    <main className="relative min-h-0 flex-1 overflow-hidden" style={{ background: 'var(--canvas-bg)' }}>
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </main>
  )
}
