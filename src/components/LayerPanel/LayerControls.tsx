import { usePanelStore } from '../../stores/panelStore'
import { useUIStore } from '../../stores/uiStore'

const LAYER_COLORS: Record<string, string> = {
  interface: '#d4a017',
  panel: '#8a8a8a',
  pcb_components: '#3a8a9a',
}

export function LayerControls() {
  const layers = usePanelStore(s => s.panel.layers)
  const layerVisibility = useUIStore(s => s.layerVisibility)
  const setLayerVisibility = useUIStore(s => s.setLayerVisibility)
  const activeLayerId = useUIStore(s => s.activeLayerId)
  const setActiveLayer = useUIStore(s => s.setActiveLayer)
  const overlayMode = useUIStore(s => s.overlayMode)
  const setOverlayMode = useUIStore(s => s.setOverlayMode)
  const setLayerHeight = usePanelStore(s => s.setLayerHeight)
  const setLayerMaterial = usePanelStore(s => s.setLayerMaterial)
  const setLayerPcbLayers = usePanelStore(s => s.setLayerPcbLayers)

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--spacing-sm)',
        fontSize: '0.72rem',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--color-text-dim)',
          marginBottom: 'var(--spacing-xs)',
        }}
      >
        LAYERS
      </div>
      {[...layers].sort((a, b) => {
        const order = { interface: 0, panel: 1, pcb_components: 2 }
        return (order[a.type] ?? 3) - (order[b.type] ?? 3)
      }).map(layer => {
        const visible = layerVisibility[layer.id] ?? layer.visible
        const isActive = activeLayerId === layer.id
        const color = LAYER_COLORS[layer.type] || '#888'
        return (
          <div key={layer.id} style={{ marginBottom: '2px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                padding: '2px 0',
                cursor: 'pointer',
                color: visible ? 'var(--color-text)' : 'var(--color-text-dim)',
                userSelect: 'none',
              }}
            >
              <input
                type="radio"
                name="active-layer"
                checked={isActive}
                onChange={() => setActiveLayer(isActive ? null : layer.id)}
                style={{ accentColor: color, margin: 0 }}
              />
              <input
                type="checkbox"
                checked={visible}
                onChange={() => setLayerVisibility(layer.id, !visible)}
                style={{ accentColor: color }}
              />
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  opacity: visible ? 1 : 0.3,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>{layer.label}</span>
            </div>
            {layer.type === 'panel' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '42px', marginTop: '1px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-dim)' }}>Mat:</span>
                <select
                  value={layer.material ?? 'aluminium'}
                  onChange={e => setLayerMaterial(layer.id, e.target.value as 'aluminium' | 'pcb')}
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 4px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="aluminium">Aluminium</option>
                  <option value="pcb">PCB</option>
                </select>
              </div>
            )}
            {layer.type === 'pcb_components' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '42px', marginTop: '1px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-dim)' }}>H:</span>
                <input
                  type="number"
                  value={layer.height ?? 108.5}
                  min={1}
                  max={999}
                  step={0.1}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v > 0) setLayerHeight(layer.id, v)
                  }}
                  style={{
                    width: '52px',
                    fontSize: '0.65rem',
                    padding: '1px 4px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text)',
                  }}
                />
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-dim)' }}>mm</span>
              </div>
            )}
            {layer.type === 'pcb_components' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '42px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-dim)' }}>Layers:</span>
                <select
                  value={layer.pcbLayers ?? 2}
                  onChange={e => setLayerPcbLayers(layer.id, Number(e.target.value) as 2 | 4)}
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 4px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  <option value={2}>2 layers</option>
                  <option value={4}>4 layers</option>
                </select>
              </div>
            )}
          </div>
        )
      })}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          padding: '4px 0 0',
          cursor: 'pointer',
          fontSize: '0.65rem',
          color: 'var(--color-text-dim)',
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={overlayMode}
          onChange={() => setOverlayMode(!overlayMode)}
        />
        Overlay (see-through panel)
      </label>
    </div>
  )
}
