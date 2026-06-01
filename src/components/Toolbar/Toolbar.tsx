import { useEffect, useCallback, useState, useRef } from 'react'
import { FormatSelector } from './FormatSelector'
import { usePanelStore } from '../../stores/panelStore'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import { useThemeStore } from '../../stores/themeStore'
import { useUIStore } from '../../stores/uiStore'
import { exportKicadPcb, exportKicadPcbPanelOnly, exportKicadPcbComponentsOnly } from '../../utils/export/kicad-pcb'
import { downloadFile } from '../../utils/download'
import { downloadPanelJson, importPanelFromFile } from '../../utils/serialization'
import type { ThemeId } from '../../stores/themeStore'

const THEME_LABELS: Record<ThemeId, string> = {
  dark: '🌙',
  light: '☀',
  grey: '◐',
}

const btnBase: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-dim)',
  padding: '2px 8px',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontSize: '0.7rem',
  lineHeight: 1,
  letterSpacing: '0.05em',
}

export function Toolbar() {
  const themeId = useThemeStore(s => s.themeId)
  const cycleTheme = useThemeStore(s => s.cycleTheme)
  const activeTool = useUIStore(s => s.activeTool)
  const activePartId = useUIStore(s => s.activePartId)
  const setActiveTool = useUIStore(s => s.setActiveTool)
  const setActivePartId = useUIStore(s => s.setActivePartId)
  const textLayer = useUIStore(s => s.textLayer)
  const setTextLayer = useUIStore(s => s.setTextLayer)

  const panel = usePanelStore(s => s.panel)
  const panelLayer = panel.layers.find(l => l.type === 'panel')
  const panelMaterial = panelLayer?.material ?? 'aluminium'
  const undo = usePanelStore(s => s.undo)
  const redo = usePanelStore(s => s.redo)
  const canUndo = usePanelStore(s => s.canUndo)
  const canRedo = usePanelStore(s => s.canRedo)
  const selectedPlacementIds = useUIStore(s => s.selectedPlacementIds)
  const removePlacement = usePanelStore(s => s.removePlacement)
  const updatePlacement = usePanelStore(s => s.updatePlacement)
  const parts = usePartsLibraryStore(s => s.parts)
  const saveToDB = usePanelStore(s => s.saveToDB)
  const loadFromDB = usePanelStore(s => s.loadFromDB)
  const newPanel = usePanelStore(s => s.newPanel)
  const refreshPanelList = usePanelStore(s => s.refreshPanelList)
  const savedPanelList = usePanelStore(s => s.savedPanelList)
  const deleteFromDB = usePanelStore(s => s.deleteFromDB)

  const [showLoadList, setShowLoadList] = useState(false)
  const loadRef = useRef<HTMLDivElement>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refreshPanelList()
  }, [refreshPanelList])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (loadRef.current && !loadRef.current.contains(e.target as Node)) {
        setShowLoadList(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const deleteSelected = useCallback(() => {
    const removeTextPlacement = usePanelStore.getState().removeTextPlacement
    const pairedGroups = new Set<string>()
    const directIds = new Set(selectedPlacementIds)
    for (const id of selectedPlacementIds) {
      for (const layer of panel.layers) {
        if (layer.texts.some(t => t.id === id)) {
          removeTextPlacement(layer.type, id)
          continue
        }
        const pl = layer.placements.find(p => p.id === id)
        if (pl?.pairedGroupId) pairedGroups.add(pl.pairedGroupId)
        break
      }
    }
    const idsToRemove = new Set<string>()
    for (const layer of panel.layers) {
      for (const pl of layer.placements) {
        if (directIds.has(pl.id) || (pl.pairedGroupId && pairedGroups.has(pl.pairedGroupId))) {
          idsToRemove.add(pl.id)
        }
      }
    }
    for (const layer of panel.layers) {
      for (const id of idsToRemove) {
        if (layer.placements.some(p => p.id === id)) {
          removePlacement(layer.type, id)
        }
      }
    }
  }, [selectedPlacementIds, panel.layers, removePlacement])

  const handleExportKicad = useCallback((mode: 'full' | 'panel' | 'pcb') => {
    const name = panel.metadata.name.replace(/[^a-zA-Z0-9_-]/g, '_')
    const suffix = mode === 'full' ? '' : `_${mode}`
    const fn = mode === 'full' ? exportKicadPcb : mode === 'panel' ? exportKicadPcbPanelOnly : exportKicadPcbComponentsOnly
    const content = fn(panel, parts)
    const filename = `${name}${suffix}.kicad_pcb`
    downloadFile(content, filename, 'application/octet-stream')
    fetch('/api/save-pcb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content }),
    }).catch(() => {})
  }, [panel, parts])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') setActiveTool('text')
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'Escape') {
        setActivePartId(null)
        setActiveTool('select')
      }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      if (e.key === 'p' || e.key === 'P') setActiveTool('place')
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPlacementIds.length > 0) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        e.preventDefault()
        deleteSelected()
      }
      if (e.key === 'r' || e.key === 'R') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        e.preventDefault()
        const delta = e.shiftKey ? -90 : 90
        for (const id of selectedPlacementIds) {
          for (const layer of panel.layers) {
            const p = layer.placements.find(p => p.id === id)
            if (p) {
              updatePlacement(layer.type, id, { rotation: p.rotation + delta })
              break
            }
          }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, deleteSelected, selectedPlacementIds.length, panel.layers, updatePlacement])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importPanelFromFile(file)
      usePanelStore.getState().loadFromObject(imported)
    } catch (err) {
      console.error('Import failed:', err)
    }
    if (importRef.current) importRef.current.value = ''
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        gap: 'var(--spacing-md)',
      }}
    >
      <span style={{ fontWeight: 500, letterSpacing: '0.05em', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
        PANEL DESIGNER
      </span>
      <FormatSelector />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <div
          style={{
            display: 'flex',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setActiveTool('select')}
            title="Select (V)"
            style={{
              background: activeTool === 'select' ? 'var(--color-bg)' : 'transparent',
              border: 'none',
              color: activeTool === 'select' ? 'var(--color-text)' : 'var(--color-text-dim)',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            ◇ Select
          </button>
          <button
            onClick={() => activePartId ? null : setActiveTool('place')}
            title="Place (P)"
            disabled={!activePartId}
            style={{
              background: activeTool === 'place' ? 'var(--color-bg)' : 'transparent',
              border: 'none',
              borderLeft: '1px solid var(--color-border)',
              color: activeTool === 'place' ? '#d4a017' : activePartId ? 'var(--color-text-dim)' : 'var(--color-border)',
              padding: '2px 8px',
              cursor: activePartId ? 'pointer' : 'default',
              fontSize: '0.75rem',
            }}
          >
            ⚬ Place
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'text' ? 'select' : 'text')}
            title="Text (T)"
            style={{
              background: activeTool === 'text' ? 'var(--color-bg)' : 'transparent',
              border: 'none',
              borderLeft: '1px solid var(--color-border)',
              color: activeTool === 'text' ? '#d4a017' : 'var(--color-text-dim)',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            T
          </button>
        </div>
        {activeTool === 'text' && (
          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              fontSize: '0.68rem',
            }}
          >
            <button
              onClick={() => setTextLayer('silkscreen')}
              style={{
                background: textLayer === 'silkscreen' ? 'var(--color-bg)' : 'transparent',
                border: 'none',
                color: textLayer === 'silkscreen' ? '#fff' : 'var(--color-text-dim)',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Silkscreen
            </button>
            <button
              onClick={() => panelMaterial !== 'aluminium' && setTextLayer('copper')}
              title={panelMaterial === 'aluminium' ? 'Not available on aluminium panel' : 'Copper text'}
              style={{
                background: textLayer === 'copper' ? 'var(--color-bg)' : 'transparent',
                border: 'none',
                borderLeft: '1px solid var(--color-border)',
                color: textLayer === 'copper' ? '#c07a3a' : panelMaterial === 'aluminium' ? 'var(--color-border)' : 'var(--color-text-dim)',
                padding: '2px 8px',
                cursor: panelMaterial === 'aluminium' ? 'not-allowed' : 'pointer',
              }}
            >
              Copper
            </button>
          </div>
        )}

        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: canUndo ? 'var(--color-text)' : 'var(--color-border)',
            padding: '2px 8px',
            borderRadius: 'var(--radius)',
            cursor: canUndo ? 'pointer' : 'default',
            fontSize: '0.85rem',
            lineHeight: 1,
          }}
        >
          ↶
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: canRedo ? 'var(--color-text)' : 'var(--color-border)',
            padding: '2px 8px',
            borderRadius: 'var(--radius)',
            cursor: canRedo ? 'pointer' : 'default',
            fontSize: '0.85rem',
            lineHeight: 1,
          }}
        >
          ↷
        </button>
        <span style={{ width: '1px', height: '16px', background: 'var(--color-border)' }} />

        <button onClick={() => { newPanel(); setShowLoadList(false) }} style={btnBase} title="New panel">
          + New
        </button>
        <button onClick={async () => { await saveToDB(); setShowLoadList(false) }} style={btnBase} title="Save to IndexedDB (Ctrl+S)">
          Save
        </button>

        <div ref={loadRef} style={{ position: 'relative' }}>
          <button onClick={() => { refreshPanelList(); setShowLoadList(s => !s) }} style={btnBase} title="Load saved panel">
            Load ▾
          </button>
          {showLoadList && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                minWidth: '220px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {savedPanelList.length === 0 ? (
                <div style={{ padding: '8px 12px', color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>
                  No saved panels
                </div>
              ) : (
                savedPanelList.map(sp => (
                  <div
                    key={sp.id}
                    onClick={async () => { await loadFromDB(sp.id); setShowLoadList(false) }}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sp.name}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)' }}>
                        {new Date(sp.modified).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await deleteFromDB(sp.id) }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        padding: '2px 4px',
                        opacity: 0.6,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <span style={{ width: '1px', height: '16px', background: 'var(--color-border)' }} />

        <button onClick={() => downloadPanelJson(panel)} style={btnBase} title="Export panel as JSON">
          Export
        </button>
        <button onClick={() => importRef.current?.click()} style={btnBase} title="Import panel from JSON">
          Import
        </button>
        <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />

        <span style={{ width: '1px', height: '16px', background: 'var(--color-border)' }} />

        <button
          onClick={() => handleExportKicad('full')}
          title="Export full KiCad PCB (panel + components)"
          style={btnBase}
        >
          Full
        </button>
        <button
          onClick={() => handleExportKicad('panel')}
          title="Export panel only (outline + cutouts + silkscreen)"
          style={btnBase}
        >
          Panel
        </button>
        <button
          onClick={() => handleExportKicad('pcb')}
          title="Export PCB components only"
          style={btnBase}
        >
          PCB
        </button>
        <button
          onClick={cycleTheme}
          title={`Theme: ${themeId}`}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-dim)',
            padding: '2px 8px',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
          }}
        >
          {THEME_LABELS[themeId]}
        </button>
        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>v0.4.0</span>
      </div>
    </div>
  )
}
