import { useEffect, useRef, useState } from 'react'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import { useUIStore } from '../../stores/uiStore'
import { LayerControls } from '../LayerPanel/LayerControls'
import { PartEditor } from './PartEditor'
import type { LayerType } from '../../core/types/part'

const LAYER_TYPES: LayerType[] = ['interface', 'panel', 'pcb_components']

export function PartsBrowser() {
  const parts = usePartsLibraryStore(s => s.parts)
  const groups = usePartsLibraryStore(s => s.groups)
  const selectedPartId = usePartsLibraryStore(s => s.selectedPartId)
  const selectedGroupId = usePartsLibraryStore(s => s.selectedGroupId)
  const searchQuery = usePartsLibraryStore(s => s.searchQuery)
  const loading = usePartsLibraryStore(s => s.loading)
  const expandedGroupIds = usePartsLibraryStore(s => s.expandedGroupIds)
  const groupSlotOverrides = usePartsLibraryStore(s => s.groupSlotOverrides)
  const loadFromDB = usePartsLibraryStore(s => s.loadFromDB)
  const setSearchQuery = usePartsLibraryStore(s => s.setSearchQuery)
  const removePart = usePartsLibraryStore(s => s.removePart)
  const updatePart = usePartsLibraryStore(s => s.updatePart)
  const importFromFile = usePartsLibraryStore(s => s.importFromFile)
  const toggleGroupExpanded = usePartsLibraryStore(s => s.toggleGroupExpanded)
  const setSlotOverride = usePartsLibraryStore(s => s.setSlotOverride)

  const activePartId = useUIStore(s => s.activePartId)
  const activeGroupId = useUIStore(s => s.activeGroupId)
  const activeTool = useUIStore(s => s.activeTool)
  const setActivePartId = useUIStore(s => s.setActivePartId)
  const setActiveGroupId = useUIStore(s => s.setActiveGroupId)

  const [editingPartId, setEditingPartId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (parts.length === 0 && !loading) loadFromDB()
  }, [])

  const q = searchQuery.trim().toLowerCase()
  const filteredParts = !q
    ? parts
    : parts.filter(p =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
      )
  const filteredGroups = !q
    ? groups
    : groups.filter(g =>
        g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q),
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

  const handlePartDoubleClick = (partId: string) => {
    setEditingPartId(partId)
  }

  const handleGroupClick = (groupId: string) => {
    if (activeGroupId === groupId) {
      setActiveGroupId(null)
    } else {
      setActiveGroupId(groupId)
    }
  }

  const layerTypeLabel: Record<LayerType, string> = {
    pcb_components: 'PCB',
    panel: 'Panel',
    interface: 'Interface',
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
        PARTS LIBRARY ({parts.length + groups.length})
        {(activePartId || activeGroupId) && activeTool === 'place' && (
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
        {filteredGroups.length > 0 && (
          <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div style={{
              padding: '3px var(--spacing-sm)',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: 'var(--color-text-dim)',
              letterSpacing: '0.08em',
              background: 'var(--color-bg)',
            }}>
              GROUPS ({filteredGroups.length})
            </div>
            {filteredGroups.map(group => {
              const isExpanded = expandedGroupIds.includes(group.id)
              const isActive = group.id === activeGroupId
              return (
                <div key={group.id}>
                  <div
                    onClick={() => handleGroupClick(group.id)}
                    style={{
                      padding: '4px var(--spacing-sm)',
                      borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(212,160,23,0.15)' : group.id === selectedGroupId ? 'var(--color-bg)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      borderLeft: isActive ? '2px solid #d4a017' : '2px solid transparent',
                    }}
                  >
                    <span
                      onClick={e => { e.stopPropagation(); toggleGroupExpanded(group.id) }}
                      style={{
                        cursor: 'pointer',
                        color: 'var(--color-text-dim)',
                        fontSize: '0.6rem',
                        width: 14,
                        textAlign: 'center',
                        flexShrink: 0,
                        userSelect: 'none',
                      }}
                    >
                      {isExpanded ? '▾' : '▸'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {group.name}
                      </div>
                      <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem' }}>
                        {group.category}
                        {group.dimensions && ` · ${group.dimensions.width.toFixed(1)}×${group.dimensions.height.toFixed(1)}`}
                        <span style={{ color: '#6a9fb5' }}> · {group.slots.length} parts</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ background: 'rgba(0,0,0,0.03)' }}>
                      {group.slots.map((slot, idx) => {
                        const override = groupSlotOverrides[group.id]?.[idx]
                        const currentPartName = override ?? slot.partName
                        const sameLayerParts = parts.filter(p => p.layerType === slot.layerType)
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '2px var(--spacing-sm) 2px 20px',
                              borderBottom: '1px solid var(--color-border)',
                              fontSize: '0.68rem',
                            }}
                          >
                            <div style={{ color: 'var(--color-text-dim)', marginBottom: 2 }}>
                              {layerTypeLabel[slot.layerType]}
                            </div>
                            <select
                              value={currentPartName}
                              onChange={e => setSlotOverride(group.id, idx, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                padding: '2px 4px',
                                borderRadius: 'var(--radius)',
                                fontSize: '0.68rem',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {sameLayerParts.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{
          padding: '3px var(--spacing-sm)',
          fontSize: '0.65rem',
          fontWeight: 600,
          color: 'var(--color-text-dim)',
          letterSpacing: '0.08em',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          PARTS ({filteredParts.length})
        </div>

        {filteredParts.length === 0 && (
          <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-dim)', textAlign: 'center' }}>
            {loading ? 'loading...' : 'no parts'}
          </div>
        )}
        {filteredParts.map(part => {
          const pairedPart = part.pairedPanelPartId ? parts.find(p => p.id === part.pairedPanelPartId) : undefined
          return (
            <div
              key={part.id}
              onClick={() => handlePartClick(part.id)}
              onDoubleClick={() => handlePartDoubleClick(part.id)}
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
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span>{part.category}</span>
                  <span>·</span>
                  <select
                    value={part.layerType}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updatePart(part.id, { layerType: e.target.value as LayerType })}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-dim)',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      padding: 0,
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: 2,
                    }}
                  >
                    {LAYER_TYPES.map(lt => (
                      <option key={lt} value={lt}>{lt}</option>
                    ))}
                  </select>
                  {part.dimensions && (
                    <span>· {part.dimensions.width.toFixed(1)}×{part.dimensions.height.toFixed(1)}</span>
                  )}
                  {part.pairedPanelPartId && <span style={{ color: '#8a8a8a' }}>· panel hole</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button
                  onClick={e => { e.stopPropagation(); setEditingPartId(part.id) }}
                  title="Edit part"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-dim)',
                    cursor: 'pointer',
                    padding: '0 2px',
                    fontSize: '0.65rem',
                    opacity: 0.35,
                  }}
                >
                  ✎
                </button>
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

      {editingPartId && (
        <PartEditor partId={editingPartId} onClose={() => setEditingPartId(null)} />
      )}
    </div>
  )
}