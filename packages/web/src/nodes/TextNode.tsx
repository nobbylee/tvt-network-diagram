import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { type NodeProps, NodeResizer } from '@xyflow/react'
import type { TextNode } from '../types/diagram'
import { useCanvasStore } from '../stores/canvasStore'

function TextNodeComponent({ id, data, selected }: NodeProps<TextNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const takeSnapshot = useCanvasStore((s) => s.takeSnapshot)
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fontSize = data.fontSize ?? 13
  const color = data.color ?? 'var(--text-primary)'

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [editing])

  const commit = useCallback(
    (value: string) => {
      const next = value.trim() || '备注'
      if (next !== data.text) {
        takeSnapshot()
        updateNodeData(id, { text: next })
      }
      setEditing(false)
    },
    [data.text, id, takeSnapshot, updateNodeData],
  )

  return (
    <div
      className="min-w-[80px] max-w-[280px] rounded-md border px-2.5 py-1.5 shadow-sm"
      style={{
        background: 'var(--panel-bg)',
        borderColor: selected ? 'var(--accent)' : 'var(--panel-border)',
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? '0 0 0 3px rgba(0, 102, 204, 0.1)' : 'none',
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={32}
        color="var(--accent)"
      />
      {editing ? (
        <textarea
          ref={textareaRef}
          defaultValue={data.text}
          className="nodrag nopan nowheel w-full resize-none bg-transparent outline-none"
          style={{ fontSize, color, minHeight: 40 }}
          rows={3}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditing(false)
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              commit((e.target as HTMLTextAreaElement).value)
            }
          }}
        />
      ) : (
        <div
          className="whitespace-pre-wrap break-words leading-snug"
          style={{ fontSize, color }}
        >
          {data.text || '备注'}
        </div>
      )}
    </div>
  )
}

export const TextNodeView = memo(TextNodeComponent)
