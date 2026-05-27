export type PanelFormatId = 'eurorack' | '4u' | 'buchla'

export interface MountingHoleSpec {
  diameter: number
  xFromEdge: number
  yFromTop: number
  yFromBottom: number
}

export interface PanelFormat {
  id: PanelFormatId
  name: string
  description: string
  heightMm: number
  hpWidthMm: number
  pcbHeightMm: number
  pcbOffsetY: number
  railMarginTop: number
  railMarginBottom: number
  mountingHole: MountingHoleSpec
  screwType: string
  getActualWidth(hp: number): number
}
