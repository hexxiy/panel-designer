import type { LayerType, ComponentPairing } from './part'
import type { PanelFormatId } from './format'
import { getFormat } from '../standards'

export interface PanelDimensions {
  hp: number
  actualWidthMm: number
  heightMm: number
}

export interface Placement {
  id: string
  partId: string
  x: number
  y: number
  rotation: number
  locked: boolean
  pairedGroupId?: string
}

export interface TextPlacement {
  id: string
  x: number
  y: number
  rotation: number
  locked: boolean
  label: string
  fontSize: number
}

export interface Layer {
  id: string
  type: LayerType
  label: string
  visible: boolean
  locked: boolean
  placements: Placement[]
  texts: TextPlacement[]
  height?: number
  material?: 'aluminium' | 'pcb'
  pcbLayers?: 2 | 4
}

export interface MountingHoleOverride {
  ringDiameter: number
}

export interface Panel {
  id: string
  format: PanelFormatId
  dimensions: PanelDimensions
  layers: Layer[]
  pairings: ComponentPairing[]
  metadata: PanelMetadata
  mountingHoleOverrides: Record<number, MountingHoleOverride>
}

export interface PanelMetadata {
  name: string
  author?: string
  created: string
  modified: string
  version: number
}

export function createLayer(type: LayerType, label: string, height?: number): Layer {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    visible: true,
    locked: false,
    placements: [],
    texts: [],
    height,
  }
}

export function createPanel(format: PanelFormatId, hp: number, actualWidthMm: number, heightMm: number): Panel {
  const fmt = getFormat(format)
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    format,
    dimensions: { hp, actualWidthMm, heightMm },
    layers: [
      { ...createLayer('pcb_components', 'PCB Components', fmt.pcbHeightMm), pcbLayers: 2 },
      { ...createLayer('panel', 'Panel'), material: 'aluminium' },
      createLayer('interface', 'Interface Components'),
    ],
    pairings: [],
    mountingHoleOverrides: {},
    metadata: { name: 'Untitled Panel', created: now, modified: now, version: 1 },
  }
}
