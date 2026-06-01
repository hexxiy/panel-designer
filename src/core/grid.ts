import type { Placement } from './types/panel'

export interface GridConfig {
  enabled: boolean
  gridX: number
  gridY: number
  safetyMargin: number
  showGrid: boolean
  hpSnap: boolean
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  enabled: true,
  gridX: 5.08,
  gridY: 5,
  safetyMargin: 1,
  showGrid: true,
  hpSnap: true,
}

export interface GridPosition {
  x: number
  y: number
}

export function snapToGrid(pos: GridPosition, config: GridConfig): GridPosition {
  if (!config.enabled) return pos
  return {
    x: Math.round(pos.x / config.gridX) * config.gridX,
    y: Math.round(pos.y / config.gridY) * config.gridY,
  }
}

export function hpToGridX(hp: number): number {
  return hp * 5.08
}

export function gridXToHp(x: number): number {
  return x / 5.08
}

export interface BoundingBox {
  left: number
  right: number
  top: number
  bottom: number
}

export function getBoundingBox(placement: Placement, halfW: number, halfH: number): BoundingBox {
  return {
    left: placement.x - halfW,
    right: placement.x + halfW,
    top: placement.y + halfH,
    bottom: placement.y - halfH,
  }
}

export function getPartBoundingBox(x: number, y: number, halfW: number, halfH: number): BoundingBox {
  return {
    left: x - halfW,
    right: x + halfW,
    top: y + halfH,
    bottom: y - halfH,
  }
}

export function boxesOverlap(a: BoundingBox, b: BoundingBox, buffer: number = 0): boolean {
  return (
    a.left < b.right + buffer &&
    a.right > b.left - buffer &&
    a.bottom < b.top + buffer &&
    a.top > b.bottom - buffer
  )
}

export function partMargin(part: { dimensions: { width: number; height: number } }): number {
  return Math.max(1, Math.min(part.dimensions.width, part.dimensions.height) * 0.1)
}

export function placementWithinBounds(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  panelWidth: number,
  panelHeight: number,
  margin: number = 1,
): boolean {
  const box = getPartBoundingBox(x, y, halfW, halfH)
  return (
    box.left >= margin &&
    box.right <= panelWidth - margin &&
    box.bottom >= margin &&
    box.top <= panelHeight - margin
  )
}

export function checkPlacementWithinBounds(
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  margin: number = 1,
): boolean {
  return x >= margin && x <= panelWidth - margin && y >= margin && y <= panelHeight - margin
}
