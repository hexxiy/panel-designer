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

export interface Layer {
  id: string
  type: LayerType
  label: string
  visible: boolean
  locked: boolean
  placements: Placement[]
  height?: number
}

export interface Panel {
  id: string
  format: PanelFormatId
  dimensions: PanelDimensions
  layers: Layer[]
  pairings: ComponentPairing[]
  metadata: PanelMetadata
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
      createLayer('interface', 'Interface Components'),
      createLayer('panel', 'Panel'),
      createLayer('pcb_components', 'PCB Components', fmt.pcbHeightMm),
    ],
    pairings: [],
    metadata: { name: 'Untitled Panel', created: now, modified: now, version: 1 },
  }
}
