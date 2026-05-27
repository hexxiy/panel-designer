import { create } from 'zustand'

export type ActiveTool = 'select' | 'place'

interface UIState {
  activeTool: ActiveTool
  activePartId: string | null
  selectedPlacementIds: string[]
  zoom: number
  panX: number
  panY: number
  layerVisibility: Record<string, boolean>
  activeLayerId: string | null
  overlayMode: boolean

  setActiveTool: (tool: ActiveTool) => void
  setActivePartId: (id: string | null) => void
  selectPlacement: (id: string | null) => void
  selectPlacements: (ids: string[]) => void
  clearSelection: () => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setLayerVisibility: (layerId: string, visible: boolean) => void
  setActiveLayer: (layerId: string | null) => void
  setOverlayMode: (overlay: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'select',
  activePartId: null,
  selectedPlacementIds: [],
  zoom: 2,
  panX: 0,
  panY: 0,
  layerVisibility: {},
  activeLayerId: null,
  overlayMode: false,

  setActiveTool: (tool) => set(s => ({
    activeTool: tool,
    activePartId: tool === 'select' ? null : s.activePartId,
  })),
  setActivePartId: (id) => set({ activePartId: id, activeTool: id ? 'place' : 'select' }),

  selectPlacement: (id) => set({ selectedPlacementIds: id ? [id] : [] }),
  selectPlacements: (ids) => set({ selectedPlacementIds: ids }),
  clearSelection: () => set({ selectedPlacementIds: [] }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(5, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setLayerVisibility: (layerId, visible) =>
    set(s => ({ layerVisibility: { ...s.layerVisibility, [layerId]: visible } })),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  setOverlayMode: (overlay) => set({ overlayMode: overlay }),
}))
