import type { PanelFormat } from '../types/format'

const HP_WIDTH_MM = 5.08
const PANEL_HEIGHT_MM = 177.8
const PCB_HEIGHT_MM = 157.8
const RAIL_MARGIN = (PANEL_HEIGHT_MM - PCB_HEIGHT_MM) / 2

function getActualWidth(hp: number): number {
  if (hp <= 0) return 0
  return hp * HP_WIDTH_MM - 0.3
}

export const fourU: PanelFormat = {
  id: '4u',
  name: '4U',
  description: '4U format (often used for Serge / Buchla)',
  heightMm: PANEL_HEIGHT_MM,
  hpWidthMm: HP_WIDTH_MM,
  pcbHeightMm: PCB_HEIGHT_MM,
  pcbOffsetY: RAIL_MARGIN,
  railMarginTop: RAIL_MARGIN,
  railMarginBottom: RAIL_MARGIN,
  mountingHole: {
    diameter: 3.2,
    xFromEdge: 7.5,
    yFromTop: 4,
    yFromBottom: 4,
  },
  screwType: 'M3',
  getActualWidth,
}
