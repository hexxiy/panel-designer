export type Token =
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'symbol'; value: string }

export interface SExpr {
  name: string
  children: (SExpr | string | number)[]
}

export interface KiCadPad {
  number: string
  type: string
  shape: string
  at: { x: number; y: number }
  size: { x: number; y: number }
  drill: number | { width: number; height: number }
  layers: string[]
}

export interface KiCadModel {
  path: string
  offset: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  rotate: { x: number; y: number; z: number }
}

export interface KiCadLine {
  type: 'line'
  start: { x: number; y: number }
  end: { x: number; y: number }
  width: number
  layer: string
}

export interface KiCadCircle {
  type: 'circle'
  center: { x: number; y: number }
  end: { x: number; y: number }
  width: number
  layer: string
}

export interface KiCadArc {
  type: 'arc'
  start: { x: number; y: number }
  end: { x: number; y: number }
  mid?: { x: number; y: number }
  angle?: number
  width: number
  layer: string
}

export interface KiCadGraphicText {
  type: 'text'
  text: string
  at: { x: number; y: number }
  size: { x: number; y: number }
  thickness: number
  layer: string
}

export type KiCadGraphic = KiCadLine | KiCadCircle | KiCadArc | KiCadGraphicText

export interface KiCadFootprint {
  name: string
  version?: number
  generator?: string
  layer?: string
  attr?: string
  pads: KiCadPad[]
  models: KiCadModel[]
  graphics: KiCadGraphic[]
}
