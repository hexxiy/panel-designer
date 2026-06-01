import { create } from 'zustand'

export type ActiveTool = 'select' | 'place' | 'text'

interface UIState {
  activeTool: ActiveTool
  activePartId: string | null
  activeGroupId: string | null
  selectedPlacementIds: string[]
  selectedMountingHoleIndex: number | null
  zoom: number
  panX: number
  panY: number
  layerVisibility: Record<string, boolean>
  activeLayerId: string | null
  overlayMode: boolean
  showGrid: boolean
  gridSize: number
  textLayer: 'silkscreen' | 'copper'
  textContent: string
  textFontSize: number

  setActiveTool: (tool: ActiveTool) => void
  setActivePartId: (id: string | null) => void
  setActiveGroupId: (id: string | null) => void
  selectPlacement: (id: string | null) => void
  selectPlacements: (ids: string[]) => void
  clearSelection: () => void
  selectMountingHole: (index: number | null) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setLayerVisibility: (layerId: string, visible: boolean) => void
  setActiveLayer: (layerId: string | null) => void
  setOverlayMode: (overlay: boolean) => void
  setShowGrid: (show: boolean) => void
  setGridSize: (size: number) => void
  setTextLayer: (layer: 'silkscreen' | 'copper') => void
  setTextContent: (content: string) => void
  setTextFontSize: (size: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'select',
  activePartId: null,
  activeGroupId: null,
  selectedPlacementIds: [],
  selectedMountingHoleIndex: null,
  zoom: 2,
  panX: 0,
  panY: 0,
  layerVisibility: {},
  activeLayerId: null,
  overlayMode: false,
  showGrid: true,
  gridSize: 10,
  textLayer: 'silkscreen',
  textContent: 'Text',
  textFontSize: 3,

  setActiveTool: (tool) => set(s => ({
    activeTool: tool,
    activePartId: tool === 'select' || tool === 'text' ? null : s.activePartId,
    activeGroupId: tool === 'select' || tool === 'text' ? null : s.activeGroupId,
  })),
  setActivePartId: (id) => set({ activePartId: id, activeGroupId: null, activeTool: id ? 'place' : 'select' }),
  setActiveGroupId: (id) => set({ activeGroupId: id, activePartId: null, activeTool: id ? 'place' : 'select' }),

  selectPlacement: (id) => set({ selectedPlacementIds: id ? [id] : [], selectedMountingHoleIndex: null }),
  selectPlacements: (ids) => set({ selectedPlacementIds: ids, selectedMountingHoleIndex: null }),
  clearSelection: () => set({ selectedPlacementIds: [], selectedMountingHoleIndex: null }),
  selectMountingHole: (index) => set({ selectedMountingHoleIndex: index, selectedPlacementIds: [] }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(20, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setLayerVisibility: (layerId, visible) =>
    set(s => ({ layerVisibility: { ...s.layerVisibility, [layerId]: visible } })),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  setOverlayMode: (overlay) => set({ overlayMode: overlay }),
  setShowGrid: (show) => set({ showGrid: show }),
  setGridSize: (size) => set({ gridSize: Math.max(1, size) }),
  setTextLayer: (layer) => set({ textLayer: layer }),
  setTextContent: (content) => set({ textContent: content }),
  setTextFontSize: (size) => set({ textFontSize: Math.max(1, size) }),
}))
