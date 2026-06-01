export type PartCategory = 'pot' | 'jack' | 'switch' | 'led' | 'mounting_hole' | 'header' | 'fuse' | 'other'

export type LayerType = 'interface' | 'panel' | 'pcb_components'

export interface Part {
  id: string
  name: string
  description?: string
  category: PartCategory
  layerType: LayerType
  footprint?: KiCadFootprint
  panelCutout?: PanelCutout
  model3d?: string
  couplingGroup?: string
  pairedPanelPartId?: string
  dimensions: {
    width: number
    height: number
    depth: number
  }
}

export interface PanelCutout {
  type: 'circle' | 'rect' | 'oval'
  width: number
  height: number
  x: number
  y: number
}

export type GraphicType = 'line' | 'circle' | 'arc' | 'text'

export interface GraphicLine {
  type: 'line'
  x1: number; y1: number
  x2: number; y2: number
  width: number
}

export interface GraphicCircle {
  type: 'circle'
  cx: number; cy: number
  radius: number
  width: number
  fill?: string
}

export interface GraphicArc {
  type: 'arc'
  x1: number; y1: number
  x2: number; y2: number
  mid?: { x: number; y: number }
  angle?: number
  width: number
}

export interface GraphicText {
  type: 'text'
  text: string
  x: number; y: number
  size: number
}

export type GraphicItem = GraphicLine | GraphicCircle | GraphicArc | GraphicText

export interface KiCadFootprint {
  name: string
  pads: Pad[]
  models: string[]
  graphics: GraphicItem[]
}

export interface Pad {
  number: string
  type: 'thru_hole' | 'smd' | 'npth'
  shape: 'circle' | 'rect' | 'oval' | 'roundrect'
  x: number
  y: number
  width: number
  height: number
  drill: number | { width: number; height: number }
  layers: string[]
}

export interface ComponentPairing {
  id: string
  name: string
  interfacePartId: string
  pcbPartId: string
  dx: number
  dy: number
}

export interface PartGroupSlot {
  layerType: LayerType
  partName: string
}

export interface PartGroup {
  id: string
  name: string
  description?: string
  category: PartCategory
  slots: PartGroupSlot[]
  dimensions: {
    width: number
    height: number
    depth: number
  }
}
