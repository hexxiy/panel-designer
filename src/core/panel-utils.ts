import type { PanelFormat } from './types/format'

export interface MountingHole {
  x: number
  y: number
  diameter: number
}

export function computeMountingHoles(
  panelWidthMm: number,
  panelHeightMm: number,
  format: PanelFormat,
): MountingHole[] {
  const { mountingHole } = format
  const holes: MountingHole[] = []
  const useFourHoles = mountingHole.xFromEdge * 2 < panelWidthMm

  if (useFourHoles) {
    holes.push(
      { x: mountingHole.xFromEdge, y: mountingHole.yFromTop, diameter: mountingHole.diameter },
      { x: panelWidthMm - mountingHole.xFromEdge, y: mountingHole.yFromTop, diameter: mountingHole.diameter },
      { x: mountingHole.xFromEdge, y: panelHeightMm - mountingHole.yFromBottom, diameter: mountingHole.diameter },
      { x: panelWidthMm - mountingHole.xFromEdge, y: panelHeightMm - mountingHole.yFromBottom, diameter: mountingHole.diameter },
    )
  } else {
    const cx = panelWidthMm / 2
    holes.push(
      { x: cx, y: mountingHole.yFromTop, diameter: mountingHole.diameter },
      { x: cx, y: panelHeightMm - mountingHole.yFromBottom, diameter: mountingHole.diameter },
    )
  }

  return holes
}
