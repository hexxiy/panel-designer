import { usePanelStore } from '../../stores/panelStore'
import { useUIStore } from '../../stores/uiStore'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import type { PanelFormatId } from '../../core/types'
import { getFormatIds } from '../../core/standards'

const section: React.CSSProperties = {
  padding: 'var(--spacing-md)',
  borderBottom: '1px solid var(--color-border)',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--color-text-dim)',
  marginBottom: 'var(--spacing-sm)',
  textTransform: 'uppercase',
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--spacing-xs)',
  gap: 'var(--spacing-sm)',
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-dim)',
  whiteSpace: 'nowrap',
  minWidth: '60px',
}

const input: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '3px 6px',
  borderRadius: 'var(--radius)',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
}

const narrowInput: React.CSSProperties = {
  ...input,
  width: '70px',
  textAlign: 'center',
}

const select: React.CSSProperties = {
  ...input,
  width: '100%',
  cursor: 'pointer',
}

const checkbox: React.CSSProperties = {
  cursor: 'pointer',
  accentColor: 'var(--color-accent)',
}

const btn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-danger)',
  color: 'var(--color-danger)',
  padding: '3px 10px',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontSize: '0.75rem',
  width: '100%',
}

export function PropertiesPanel() {
  const panel = usePanelStore(s => s.panel)
  const setFormat = usePanelStore(s => s.setFormat)
  const setHp = usePanelStore(s => s.setHp)
  const setPanelName = usePanelStore(s => s.setPanelName)
  const setPanelAuthor = usePanelStore(s => s.setPanelAuthor)
  const updatePlacement = usePanelStore(s => s.updatePlacement)
  const removePlacement = usePanelStore(s => s.removePlacement)
  const selectedPlacementIds = useUIStore(s => s.selectedPlacementIds)
  const parts = usePartsLibraryStore(s => s.parts)

  let selected: { placement: import('../../core/types/panel').Placement; layerType: string; part: import('../../core/types/part').Part | undefined } | null = null
  if (selectedPlacementIds.length === 1) {
    for (const layer of panel.layers) {
      const found = layer.placements.find(p => p.id === selectedPlacementIds[0])
      if (found) {
        selected = { placement: found, layerType: layer.type, part: parts.find(p => p.id === found.partId) }
        break
      }
    }
  }

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        overflowY: 'auto',
        fontSize: '0.75rem',
      }}
    >
      {/* Panel Settings */}
      <div style={section}>
        <div style={sectionTitle}>Panel Settings</div>

        <div style={row}>
          <span style={label}>Name</span>
          <input
            style={input}
            value={panel.metadata.name}
            onChange={e => setPanelName(e.target.value)}
          />
        </div>

        <div style={row}>
          <span style={label}>Author</span>
          <input
            style={input}
            value={panel.metadata.author ?? ''}
            onChange={e => setPanelAuthor(e.target.value)}
          />
        </div>

        <div style={row}>
          <span style={label}>Format</span>
          <select
            style={select}
            value={panel.format}
            onChange={e => setFormat(e.target.value as PanelFormatId)}
          >
            {getFormatIds().map(id => (
              <option key={id} value={id}>
                {id === 'eurorack' ? 'Eurorack' : id === '4u' ? '4U' : 'Buchla'}
              </option>
            ))}
          </select>
        </div>

        <div style={row}>
          <span style={label}>HP</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              style={narrowInput}
              type="number"
              min={2}
              max={104}
              value={panel.dimensions.hp}
              onChange={e => setHp(Number(e.target.value))}
            />
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>HP</span>
          </div>
        </div>

        <div style={row}>
          <span style={label}>Size</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            {panel.dimensions.actualWidthMm.toFixed(1)} × {panel.dimensions.heightMm.toFixed(1)} mm
          </span>
        </div>
      </div>

      {/* Placement Properties */}
      {selected ? (
        <div style={section}>
          <div style={sectionTitle}>Placement Properties</div>

          <div style={row}>
            <span style={label}>Part</span>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {selected.part?.name ?? 'Unknown'}
            </span>
          </div>

          <div style={row}>
            <span style={label}>Layer</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
              {selected.layerType}
            </span>
          </div>

          <div style={row}>
            <span style={label}>X</span>
            <input
              style={narrowInput}
              type="number"
              step={0.01}
              value={Number(selected.placement.x.toFixed(2))}
              onChange={e => updatePlacement(selected!.layerType as any, selected!.placement.id, { x: Number(e.target.value) })}
            />
          </div>

          <div style={row}>
            <span style={label}>Y</span>
            <input
              style={narrowInput}
              type="number"
              step={0.01}
              value={Number(selected.placement.y.toFixed(2))}
              onChange={e => updatePlacement(selected!.layerType as any, selected!.placement.id, { y: Number(e.target.value) })}
            />
          </div>

          <div style={row}>
            <span style={label}>Rotation</span>
            <input
              style={narrowInput}
              type="number"
              step={90}
              value={selected.placement.rotation}
              onChange={e => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: Number(e.target.value) })}
            />
          </div>

          <div style={row}>
            <span style={label}>Locked</span>
            <input
              type="checkbox"
              style={checkbox}
              checked={selected.placement.locked}
              onChange={e => updatePlacement(selected!.layerType as any, selected!.placement.id, { locked: e.target.checked })}
            />
          </div>

          <div style={{ ...row, marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
            <button
              style={btn}
              onClick={() => removePlacement(selected!.layerType as any, selected!.placement.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
