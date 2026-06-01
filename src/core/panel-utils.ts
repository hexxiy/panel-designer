import type { PanelFormat } from './types/format'
import type { MountingHoleOverride } from './types/panel'

export interface MountingHole {
  x: number
  y: number
  diameter: number
  ringDiameter: number
}

export function computeMountingHoles(
  panelWidthMm: number,
  panelHeightMm: number,
  format: PanelFormat,
  overrides?: Record<number, MountingHoleOverride>,
): MountingHole[] {
  const { mountingHole } = format
  const holes: MountingHole[] = []
  const useFourHoles = mountingHole.xFromEdge * 2 < panelWidthMm

  const makeHole = (x: number, y: number, index: number): MountingHole => ({
    x, y,
    diameter: mountingHole.diameter,
    ringDiameter: overrides?.[index]?.ringDiameter ?? mountingHole.diameter,
  })

  if (useFourHoles) {
    holes.push(
      makeHole(mountingHole.xFromEdge, mountingHole.yFromTop, 0),
      makeHole(panelWidthMm - mountingHole.xFromEdge, mountingHole.yFromTop, 1),
      makeHole(mountingHole.xFromEdge, panelHeightMm - mountingHole.yFromBottom, 2),
      makeHole(panelWidthMm - mountingHole.xFromEdge, panelHeightMm - mountingHole.yFromBottom, 3),
    )
  } else {
    const cx = panelWidthMm / 2
    holes.push(
      makeHole(cx, mountingHole.yFromTop, 0),
      makeHole(cx, panelHeightMm - mountingHole.yFromBottom, 1),
    )
  }

  return holes
}
