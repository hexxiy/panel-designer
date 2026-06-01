import { useMemo } from 'react'
import { usePanelStore } from '../../stores/panelStore'
import { useUIStore } from '../../stores/uiStore'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import type { PanelFormatId } from '../../core/types'
import { getFormatIds } from '../../core/standards'
import { getFormat } from '../../core'
import { computeMountingHoles } from '../../core/panel-utils'

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

const smallBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-dim)',
  padding: '2px 6px',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontSize: '0.7rem',
  lineHeight: 1,
}

export function PropertiesPanel() {
  const panel = usePanelStore(s => s.panel)
  const setFormat = usePanelStore(s => s.setFormat)
  const setHp = usePanelStore(s => s.setHp)
  const setPanelName = usePanelStore(s => s.setPanelName)
  const setPanelAuthor = usePanelStore(s => s.setPanelAuthor)
  const updatePlacement = usePanelStore(s => s.updatePlacement)
  const removePlacement = usePanelStore(s => s.removePlacement)
  const setMountingHoleRingDiameter = usePanelStore(s => s.setMountingHoleRingDiameter)
  const selectedPlacementIds = useUIStore(s => s.selectedPlacementIds)
  const selectedMountingHoleIndex = useUIStore(s => s.selectedMountingHoleIndex)
  const showGrid = useUIStore(s => s.showGrid)
  const gridSize = useUIStore(s => s.gridSize)
  const setShowGrid = useUIStore(s => s.setShowGrid)
  const setGridSize = useUIStore(s => s.setGridSize)
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

  const format = useMemo(() => getFormat(panel.format as any), [panel.format])
  const holes = useMemo(() =>
    computeMountingHoles(panel.dimensions.actualWidthMm, panel.dimensions.heightMm, format, panel.mountingHoleOverrides),
    [panel.dimensions.actualWidthMm, panel.dimensions.heightMm, format, panel.mountingHoleOverrides]
  )
  const selectedHole = selectedMountingHoleIndex !== null ? holes[selectedMountingHoleIndex] : null

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

      {/* Grid Settings */}
      <div style={section}>
        <div style={sectionTitle}>Grid</div>

        <div style={row}>
          <span style={label}>Show</span>
          <input
            type="checkbox"
            style={checkbox}
            checked={showGrid}
            onChange={e => setShowGrid(e.target.checked)}
          />
        </div>

        <div style={row}>
          <span style={label}>Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              style={narrowInput}
              type="number"
              min={1}
              max={100}
              step={1}
              value={gridSize}
              onChange={e => setGridSize(Number(e.target.value))}
            />
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>mm</span>
          </div>
        </div>
      </div>

      {/* Placement Properties */}
      {selectedPlacementIds.length > 0 ? (
        <div style={section}>
          <div style={sectionTitle}>
            {selectedPlacementIds.length === 1 ? 'Placement Properties' : `Placements (${selectedPlacementIds.length})`}
          </div>

          {selectedPlacementIds.length === 1 && selected ? (
            <>
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
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    style={{ ...narrowInput, width: 50 }}
                    type="number"
                    step={1}
                    value={selected.placement.rotation}
                    onChange={e => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: Number(e.target.value) })}
                  />
                  <button style={smallBtn} onClick={() => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: selected!.placement.rotation + 90 })}>+90</button>
                  <button style={smallBtn} onClick={() => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: selected!.placement.rotation + 45 })}>+45</button>
                  <button style={smallBtn} onClick={() => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: selected!.placement.rotation + 30 })}>+30</button>
                  <button style={smallBtn} onClick={() => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: selected!.placement.rotation - 45 })}>−45</button>
                  <button style={smallBtn} onClick={() => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: selected!.placement.rotation - 90 })}>−90</button>
                  <button style={smallBtn} onClick={() => updatePlacement(selected!.layerType as any, selected!.placement.id, { rotation: 0 })}>0</button>
                </div>
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
            </>
          ) : (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginBottom: 'var(--spacing-sm)' }}>
              {(() => {
                const names: string[] = []
                for (const id of selectedPlacementIds) {
                  for (const layer of panel.layers) {
                    const pl = layer.placements.find(p => p.id === id)
                    if (pl) {
                      const p = parts.find(p => p.id === pl.partId)
                      names.push(p?.name ?? 'Unknown')
                      break
                    }
                  }
                }
                return names.join(', ')
              })()}
            </div>
          )}

          <div style={{ ...row, marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
            <button
              style={btn}
              onClick={() => {
                for (const id of selectedPlacementIds) {
                  for (const layer of panel.layers) {
                    if (layer.placements.some(p => p.id === id)) {
                      removePlacement(layer.type, id)
                      break
                    }
                  }
                }
              }}
            >
              {selectedPlacementIds.length === 1 ? 'Delete' : `Delete All (${selectedPlacementIds.length})`}
            </button>
          </div>
        </div>
      ) : null}

      {/* Mounting Hole Properties */}
      {selectedHole && selectedMountingHoleIndex !== null ? (
        <div style={section}>
          <div style={sectionTitle}>Mounting Hole</div>

          <div style={row}>
            <span style={label}>Position</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              {selectedHole.x.toFixed(1)}, {selectedHole.y.toFixed(1)}
            </span>
          </div>

          <div style={row}>
            <span style={label}>Drill</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              {selectedHole.diameter.toFixed(1)} mm
            </span>
          </div>

          <div style={row}>
            <span style={label}>Ring</span>
            <input
              style={narrowInput}
              type="number"
              step={0.1}
              min={selectedHole.diameter}
              max={selectedHole.diameter + 10}
              value={selectedHole.ringDiameter}
              onChange={e => setMountingHoleRingDiameter(selectedMountingHoleIndex, Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
