import { create } from 'zustand'
import type { Panel, PanelFormatId, Placement, TextPlacement, LayerType } from '../core/types'
import { createPanel, getFormat } from '../core'
import { savePanel as persistPanel, listPanels } from '../utils/serialization'

const MAX_HISTORY = 50

function clonePanel(p: Panel): Panel {
  return JSON.parse(JSON.stringify(p))
}

interface PanelState {
  panel: Panel
  undoStack: Panel[]
  redoStack: Panel[]
  canUndo: boolean
  canRedo: boolean
  savedPanelList: { id: string; name: string; modified: string }[]

  undo: () => void
  redo: () => void
  clearHistory: () => void

  setFormat: (format: PanelFormatId) => void
  setHp: (hp: number) => void
  setPanelName: (name: string) => void
  setPanelAuthor: (author: string) => void
  addPlacement: (layerType: LayerType, partId: string, x: number, y: number, rotation?: number, pairedGroupId?: string) => string
  addTextPlacement: (layerType: LayerType, label: string, x: number, y: number, rotation?: number, fontSize?: number) => string
  removeTextPlacement: (layerType: LayerType, textId: string) => void
  updateTextPlacement: (layerType: LayerType, textId: string, changes: Partial<TextPlacement>) => void
  removePlacement: (layerType: LayerType, placementId: string) => void
  updatePlacement: (layerType: LayerType, placementId: string, changes: Partial<Placement>) => void
  setLayerHeight: (layerId: string, height: number) => void
  setLayerMaterial: (layerId: string, material: 'aluminium' | 'pcb') => void
  setLayerPcbLayers: (layerId: string, pcbLayers: 2 | 4) => void
  setMountingHoleRingDiameter: (index: number, ringDiameter: number) => void
  getLayerPlacements: (layerType: LayerType) => Placement[]
  saveToDB: () => Promise<void>
  loadFromDB: (id: string) => Promise<void>
  loadFromObject: (panel: Panel) => void
  newPanel: () => void
  refreshPanelList: () => Promise<void>
  deleteFromDB: (id: string) => Promise<void>
}

function buildPanel(format: PanelFormatId, hp: number): Panel {
  const fmt = getFormat(format)
  const clamped = Math.max(2, Math.min(104, hp))
  return createPanel(format, clamped, fmt.getActualWidth(clamped), fmt.heightMm)
}

function findLayer(panel: Panel, layerType: LayerType) {
  return panel.layers.find(l => l.type === layerType)
}

export const usePanelStore = create<PanelState>((set, get) => ({
  panel: buildPanel('eurorack', 10),
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  savedPanelList: [],

  undo: () => {
    const { undoStack, redoStack, panel } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    set({
      panel: clonePanel(prev),
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, clonePanel(panel)],
      canUndo: undoStack.length > 1,
      canRedo: true,
    })
  },

  redo: () => {
    const { undoStack, redoStack, panel } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    set({
      panel: clonePanel(next),
      undoStack: [...undoStack, clonePanel(panel)],
      redoStack: redoStack.slice(0, -1),
      canUndo: true,
      canRedo: redoStack.length > 1,
    })
  },

  clearHistory: () => set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false }),

  setFormat: (format) => set(s => {
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: buildPanel(format, s.panel.dimensions.hp),
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  setHp: (hp) => set(s => {
    const fmt = getFormat(s.panel.format)
    const clamped = Math.max(2, Math.min(104, hp))
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        dimensions: {
          hp: clamped,
          actualWidthMm: fmt.getActualWidth(clamped),
          heightMm: fmt.heightMm,
        },
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  setPanelName: (name) => set(s => ({
    panel: {
      ...s.panel,
      metadata: { ...s.panel.metadata, name, modified: new Date().toISOString() },
    },
  })),

  setPanelAuthor: (author) => set(s => ({
    panel: {
      ...s.panel,
      metadata: { ...s.panel.metadata, author, modified: new Date().toISOString() },
    },
  })),

  addPlacement: (layerType, partId, x, y, rotation = 0, pairedGroupId?: string) => {
    const id = crypto.randomUUID()
    set(s => {
      const layer = findLayer(s.panel, layerType)
      if (!layer) return s
      const oldPanel = clonePanel(s.panel)
      const undoStack = s.undoStack.length >= MAX_HISTORY
        ? [...s.undoStack.slice(1), oldPanel]
        : [...s.undoStack, oldPanel]
      const placement: Placement = { id, partId, x, y, rotation, locked: false, pairedGroupId }
      return {
        panel: {
          ...s.panel,
          layers: s.panel.layers.map(l =>
            l.type === layerType ? { ...l, placements: [...l.placements, placement] } : l
          ),
          metadata: { ...s.panel.metadata, modified: new Date().toISOString() },
        },
        undoStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      }
    })
    return id
  },

  removePlacement: (layerType, placementId) => set(s => {
    const layer = findLayer(s.panel, layerType)
    if (!layer) return s
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.type === layerType
            ? { ...l, placements: l.placements.filter(p => p.id !== placementId) }
            : l
        ),
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  updatePlacement: (layerType, placementId, changes) => set(s => {
    const layer = findLayer(s.panel, layerType)
    if (!layer) return s
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.type === layerType
            ? {
                ...l,
                placements: l.placements.map(p =>
                  p.id === placementId ? { ...p, ...changes } : p
                ),
              }
            : l
        ),
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  addTextPlacement: (layerType, label, x, y, rotation = 0, fontSize = 3) => {
    const id = crypto.randomUUID()
    set(s => {
      const layer = findLayer(s.panel, layerType)
      if (!layer) return s
      const oldPanel = clonePanel(s.panel)
      const undoStack = s.undoStack.length >= MAX_HISTORY
        ? [...s.undoStack.slice(1), oldPanel]
        : [...s.undoStack, oldPanel]
      const text: TextPlacement = { id, x, y, rotation, locked: false, label, fontSize }
      return {
        panel: {
          ...s.panel,
          layers: s.panel.layers.map(l =>
            l.type === layerType ? { ...l, texts: [...l.texts, text] } : l
          ),
          metadata: { ...s.panel.metadata, modified: new Date().toISOString() },
        },
        undoStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      }
    })
    return id
  },

  removeTextPlacement: (layerType, textId) => set(s => {
    const layer = findLayer(s.panel, layerType)
    if (!layer) return s
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.type === layerType
            ? { ...l, texts: l.texts.filter(t => t.id !== textId) }
            : l
        ),
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  updateTextPlacement: (layerType, textId, changes) => set(s => {
    const layer = findLayer(s.panel, layerType)
    if (!layer) return s
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.type === layerType
            ? {
                ...l,
                texts: l.texts.map(t =>
                  t.id === textId ? { ...t, ...changes } : t
                ),
              }
            : l
        ),
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  setLayerHeight: (layerId, height) => set(s => {
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.id === layerId ? { ...l, height } : l
        ),
        metadata: { ...s.panel.metadata, modified: new Date().toISOString() },
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  setLayerMaterial: (layerId, material) => set(s => {
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.id === layerId ? { ...l, material } : l
        ),
        metadata: { ...s.panel.metadata, modified: new Date().toISOString() },
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  setLayerPcbLayers: (layerId, pcbLayers) => set(s => {
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        layers: s.panel.layers.map(l =>
          l.id === layerId ? { ...l, pcbLayers } : l
        ),
        metadata: { ...s.panel.metadata, modified: new Date().toISOString() },
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  setMountingHoleRingDiameter: (index, ringDiameter) => set(s => {
    const oldPanel = clonePanel(s.panel)
    const undoStack = s.undoStack.length >= MAX_HISTORY
      ? [...s.undoStack.slice(1), oldPanel]
      : [...s.undoStack, oldPanel]
    return {
      panel: {
        ...s.panel,
        mountingHoleOverrides: {
          ...s.panel.mountingHoleOverrides,
          [index]: { ringDiameter },
        },
        metadata: { ...s.panel.metadata, modified: new Date().toISOString() },
      },
      undoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }
  }),

  getLayerPlacements: (layerType) => {
    const layer = findLayer(get().panel, layerType)
    return layer?.placements ?? []
  },

  saveToDB: async () => {
    const { panel } = get()
    await persistPanel(panel)
    const records = await listPanels()
    set({ savedPanelList: records.map(r => ({ id: r.id, name: r.name, modified: r.modified })) })
  },

  loadFromDB: async (id) => {
    const { loadPanel } = await import('../utils/serialization')
    const record = await loadPanel(id)
    if (!record) return
    set({
      panel: clonePanel(record.doc.panel),
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    })
  },

  loadFromObject: (panel) => {
    set({
      panel: clonePanel(panel),
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    })
  },

  newPanel: () => {
    set({
      panel: buildPanel('eurorack', 10),
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    })
  },

  refreshPanelList: async () => {
    const records = await listPanels()
    set({ savedPanelList: records.map(r => ({ id: r.id, name: r.name, modified: r.modified })) })
  },

  deleteFromDB: async (id) => {
    const { deletePanel } = await import('../utils/serialization')
    await deletePanel(id)
    const records = await listPanels()
    set({ savedPanelList: records.map(r => ({ id: r.id, name: r.name, modified: r.modified })) })
  },
}))
