import type { PanelFormat } from '../types/format'

const HP_WIDTH_MM = 5.08
const PANEL_HEIGHT_MM = 177.8
const PCB_HEIGHT_MM = 152.4
const RAIL_MARGIN_TOP = 12.7
const RAIL_MARGIN_BOTTOM = 12.7

function getActualWidth(hp: number): number {
  if (hp <= 0) return 0
  return hp * HP_WIDTH_MM - 0.3
}

export const buchla: PanelFormat = {
  id: 'buchla',
  name: 'Buchla',
  description: 'Buchla 4U format',
  heightMm: PANEL_HEIGHT_MM,
  hpWidthMm: HP_WIDTH_MM,
  pcbHeightMm: PCB_HEIGHT_MM,
  pcbOffsetY: RAIL_MARGIN_TOP,
  railMarginTop: RAIL_MARGIN_TOP,
  railMarginBottom: RAIL_MARGIN_BOTTOM,
  mountingHole: {
    diameter: 3.2,
    xFromEdge: 7.5,
    yFromTop: 6.35,
    yFromBottom: 6.35,
  },
  screwType: 'M3',
  getActualWidth,
}
