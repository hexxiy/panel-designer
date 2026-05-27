import type { PanelFormat } from '../types/format'

const PANEL_HEIGHT_MM = 128.5
const HP_WIDTH_MM = 5.08
const PCB_HEIGHT_MM = 108.5
const RAIL_MARGIN = (PANEL_HEIGHT_MM - PCB_HEIGHT_MM) / 2

const ACTUAL_WIDTH_TABLE: Record<number, number> = {
  1: 5.00,
  1.5: 7.50,
  2: 9.80,
  4: 20.00,
  6: 30.00,
  8: 40.30,
  10: 50.50,
  12: 60.60,
  14: 70.80,
  16: 80.90,
  18: 91.30,
  20: 101.30,
  21: 106.30,
  22: 111.40,
  28: 141.90,
  42: 213.00,
}

function getActualWidth(hp: number): number {
  const exact = ACTUAL_WIDTH_TABLE[hp]
  if (exact !== undefined) return exact
  const calc = hp * HP_WIDTH_MM
  if (hp <= 0) return 0
  if (hp <= 10) return calc - 0.3
  return calc - 0.4
}

export const eurorack: PanelFormat = {
  id: 'eurorack',
  name: 'Eurorack',
  description: 'Doepfer-compatible Eurorack 3U format',
  heightMm: PANEL_HEIGHT_MM,
  hpWidthMm: HP_WIDTH_MM,
  pcbHeightMm: PCB_HEIGHT_MM,
  pcbOffsetY: RAIL_MARGIN,
  railMarginTop: RAIL_MARGIN,
  railMarginBottom: RAIL_MARGIN,
  mountingHole: {
    diameter: 3.2,
    xFromEdge: 7.5,
    yFromTop: 3,
    yFromBottom: 3,
  },
  screwType: 'M3x6 oval-head DIN7985',
  getActualWidth,
}
