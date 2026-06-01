import { useState, useEffect } from 'react'
import type { LayerType, PartCategory } from '../../core/types/part'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'

const LAYER_TYPES: LayerType[] = ['interface', 'panel', 'pcb_components']
const CATEGORIES: PartCategory[] = ['pot', 'jack', 'switch', 'led', 'mounting_hole', 'header', 'fuse', 'other']

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.78rem',
}

const modal: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  width: 420,
  maxHeight: '80vh',
  overflowY: 'auto',
  padding: 'var(--spacing-md)',
}

const title: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  color: 'var(--color-text-dim)',
  marginBottom: 'var(--spacing-md)',
  textTransform: 'uppercase',
}

const fieldRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 'var(--spacing-sm)',
  gap: 'var(--spacing-sm)',
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-dim)',
  minWidth: 90,
  flexShrink: 0,
}

const input: React.CSSProperties = {
  flex: 1,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '3px 6px',
  borderRadius: 'var(--radius)',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  outline: 'none',
}

const narrowInput: React.CSSProperties = {
  ...input,
  flex: 'none',
  width: 60,
  textAlign: 'center',
}

const select: React.CSSProperties = {
  ...input,
  cursor: 'pointer',
}

const btnRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--spacing-sm)',
  marginTop: 'var(--spacing-md)',
}

interface PartEditorProps {
  partId: string
  onClose: () => void
}

export function PartEditor({ partId, onClose }: PartEditorProps) {
  const parts = usePartsLibraryStore(s => s.parts)
  const updatePart = usePartsLibraryStore(s => s.updatePart)
  const part = parts.find(p => p.id === partId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PartCategory>('other')
  const [layerType, setLayerType] = useState<LayerType>('pcb_components')
  const [width, setWidth] = useState(10)
  const [height, setHeight] = useState(10)
  const [depth, setDepth] = useState(0)

  useEffect(() => {
    if (!part) return
    setName(part.name)
    setDescription(part.description ?? '')
    setCategory(part.category)
    setLayerType(part.layerType)
    setWidth(part.dimensions.width)
    setHeight(part.dimensions.height)
    setDepth(part.dimensions.depth)
  }, [part])

  if (!part) return null

  const handleSave = async () => {
    await updatePart(partId, {
      name: name.trim() || part.name,
      description: description.trim() || undefined,
      category,
      layerType,
      dimensions: { width, height, depth },
    })
    onClose()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={title}>Edit Part</div>

        <div style={fieldRow}>
          <span style={label}>Name</span>
          <input style={input} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={fieldRow}>
          <span style={label}>Description</span>
          <input style={input} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div style={fieldRow}>
          <span style={label}>Category</span>
          <select style={select} value={category} onChange={e => setCategory(e.target.value as PartCategory)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={fieldRow}>
          <span style={label}>Layer Type</span>
          <select style={select} value={layerType} onChange={e => setLayerType(e.target.value as LayerType)}>
            {LAYER_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
          </select>
        </div>

        <div style={fieldRow}>
          <span style={label}>Dimensions</span>
          <input
            style={narrowInput}
            type="number"
            step={0.1}
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
          />
          <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>×</span>
          <input
            style={narrowInput}
            type="number"
            step={0.1}
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
          />
          <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>×</span>
          <input
            style={narrowInput}
            type="number"
            step={0.1}
            value={depth}
            onChange={e => setDepth(Number(e.target.value))}
          />
          <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>mm</span>
        </div>

        <div style={btnRow}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-dim)',
              padding: '4px 12px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: '#d4a017',
              border: 'none',
              color: '#000',
              padding: '4px 12px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}