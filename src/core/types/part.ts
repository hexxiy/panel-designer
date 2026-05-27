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

export interface KiCadFootprint {
  name: string
  pads: Pad[]
  models: string[]
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
