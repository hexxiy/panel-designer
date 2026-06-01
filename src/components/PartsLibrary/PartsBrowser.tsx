import { useEffect, useRef } from 'react'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import { useUIStore } from '../../stores/uiStore'
import { LayerControls } from '../LayerPanel/LayerControls'

export function PartsBrowser() {
  const parts = usePartsLibraryStore(s => s.parts)
  const selectedPartId = usePartsLibraryStore(s => s.selectedPartId)
  const searchQuery = usePartsLibraryStore(s => s.searchQuery)
  const loading = usePartsLibraryStore(s => s.loading)
  const loadFromDB = usePartsLibraryStore(s => s.loadFromDB)
  const setSearchQuery = usePartsLibraryStore(s => s.setSearchQuery)
  const removePart = usePartsLibraryStore(s => s.removePart)
  const importFromFile = usePartsLibraryStore(s => s.importFromFile)

  const activePartId = useUIStore(s => s.activePartId)
  const activeTool = useUIStore(s => s.activeTool)
  const setActivePartId = useUIStore(s => s.setActivePartId)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (parts.length === 0 && !loading) loadFromDB()
  }, [])

  const filtered = !searchQuery.trim()
    ? parts
    : parts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importFromFile(file)
    } catch (err) {
      console.error('Import failed:', err)
    }
    e.target.value = ''
  }

  const handlePartClick = (partId: string) => {
    if (activePartId === partId) {
      setActivePartId(null)
    } else {
      setActivePartId(partId)
    }
  }

  return (
    <div
      style={{
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}
    >
      <div
        style={{
          padding: 'var(--spacing-sm)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--color-text-dim)',
        }}
      >
        PARTS LIBRARY ({parts.length})
        {activePartId && activeTool === 'place' && (
          <span style={{ color: '#d4a017', marginLeft: 'var(--spacing-sm)', fontSize: '0.65rem' }}>
            ● placing
          </span>
        )}
      </div>

      <LayerControls />
      <div style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>
        <input
          type="text"
          placeholder="filter..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            padding: '3px 6px',
            borderRadius: 'var(--radius)',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-dim)', textAlign: 'center' }}>
            {loading ? 'loading...' : 'no parts'}
          </div>
        )}
        {filtered.map(part => {
          const pairedPart = part.pairedPanelPartId ? parts.find(p => p.id === part.pairedPanelPartId) : undefined
          return (
            <div
              key={part.id}
              onClick={() => handlePartClick(part.id)}
              style={{
                padding: '4px var(--spacing-sm)',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                background: part.id === activePartId ? 'rgba(212,160,23,0.15)' : part.id === selectedPartId ? 'var(--color-bg)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: part.id === activePartId ? '2px solid #d4a017' : '2px solid transparent',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {part.name}
                  {pairedPart && (
                    <span style={{ color: '#8a8a8a', marginLeft: '4px', fontSize: '0.65rem' }}>
                      + {pairedPart.name}
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem' }}>
                  {part.category} · {part.layerType}
                  {part.dimensions && ` · ${part.dimensions.width.toFixed(1)}×${part.dimensions.height.toFixed(1)}`}
                  {part.pairedPanelPartId && <span style={{ color: '#8a8a8a' }}> · panel hole</span>}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removePart(part.id) }}
                title="Remove part"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-dim)',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '0.7rem',
                  opacity: 0.4,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ padding: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".kicad_mod,.mod,.step,.stp,.wrl,.glb,.gltf"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            background: 'var(--color-bg)',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-dim)',
            padding: '6px',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '0.72rem',
          }}
        >
          + Import Part
        </button>
      </div>
    </div>
  )
}
