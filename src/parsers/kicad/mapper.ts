import type { SExpr, KiCadPad, KiCadModel, KiCadFootprint, KiCadGraphic } from './types'
import type { Part, PartCategory, LayerType, Pad } from '../../core/types/part'

function findChild(sexpr: SExpr, name: string): SExpr | undefined {
  return sexpr.children.find(
    (c): c is SExpr => typeof c === 'object' && 'name' in c && c.name === name,
  )
}

function getString(node: SExpr, index: number): string {
  const child = node.children[index]
  if (typeof child === 'string') return child
  if (typeof child === 'number') return String(child)
  return ''
}

function getNumber(node: SExpr, index: number): number {
  const child = node.children[index]
  if (typeof child === 'number') return child
  return 0
}

function getAt(node: SExpr): { x: number; y: number } {
  const at = findChild(node, 'at')
  if (!at) return { x: 0, y: 0 }
  return { x: getNumber(at, 0), y: getNumber(at, 1) }
}

function getSize(node: SExpr): { x: number; y: number } {
  const size = findChild(node, 'size')
  if (!size) return { x: 0, y: 0 }
  return { x: getNumber(size, 0), y: getNumber(size, 1) }
}

function getDrill(node: SExpr): number | { width: number; height: number } {
  const drill = findChild(node, 'drill')
  if (!drill) return 0
  const vals = drill.children.filter((c): c is number => typeof c === 'number')
  if (vals.length >= 2) return { width: vals[0], height: vals[1] }
  if (vals.length === 1) return vals[0]
  if (drill.children.length >= 2) {
    const a = drill.children[0]
    const b = drill.children[1]
    if (typeof a === 'number' && typeof b === 'number') return { width: a, height: b }
  }
  return 0
}

function getModelVec(node: SExpr, propName: string): { x: number; y: number; z: number } {
  const prop = findChild(node, propName)
  if (!prop) return { x: 0, y: 0, z: 0 }
  const xyz = findChild(prop, 'xyz')
  if (!xyz) return { x: 0, y: 0, z: 0 }
  return {
    x: getNumber(xyz, 0),
    y: getNumber(xyz, 1),
    z: getNumber(xyz, 2),
  }
}

function getStrokeWidth(node: SExpr): number {
  const stroke = findChild(node, 'stroke')
  if (stroke) {
    const w = findChild(stroke, 'width')
    if (w) return getNumber(w, 0)
  }
  const directWidth = findChild(node, 'width')
  if (directWidth) return getNumber(directWidth, 0)
  return 0.12
}

function getLayerName(node: SExpr): string {
  const layers = findChild(node, 'layer')
  if (layers) return String(layers.children[0] ?? '')
  return ''
}

function parseGraphics(sexpr: SExpr): KiCadGraphic[] {
  const graphics: KiCadGraphic[] = []
  for (const child of sexpr.children) {
    if (typeof child !== 'object') continue
    const layer = getLayerName(child as SExpr)
    if (!layer.includes('SilkS')) continue

    switch (child.name) {
      case 'fp_line': {
        const start = findChild(child as SExpr, 'start')
        const end = findChild(child as SExpr, 'end')
        if (start && end) {
          graphics.push({
            type: 'line',
            start: { x: getNumber(start, 0), y: getNumber(start, 1) },
            end: { x: getNumber(end, 0), y: getNumber(end, 1) },
            width: getStrokeWidth(child as SExpr),
            layer,
          })
        }
        break
      }
      case 'fp_circle': {
        const center = findChild(child as SExpr, 'center')
        const end = findChild(child as SExpr, 'end')
        if (center && end) {
          graphics.push({
            type: 'circle',
            center: { x: getNumber(center, 0), y: getNumber(center, 1) },
            end: { x: getNumber(end, 0), y: getNumber(end, 1) },
            width: getStrokeWidth(child as SExpr),
            layer,
          })
        }
        break
      }
      case 'fp_arc': {
        const start = findChild(child as SExpr, 'start')
        const end = findChild(child as SExpr, 'end')
        const mid = findChild(child as SExpr, 'mid')
        const angleNode = findChild(child as SExpr, 'angle')
        if (start && end) {
          const arc: KiCadGraphic = {
            type: 'arc',
            start: { x: getNumber(start, 0), y: getNumber(start, 1) },
            end: { x: getNumber(end, 0), y: getNumber(end, 1) },
            width: getStrokeWidth(child as SExpr),
            layer,
          }
          if (mid) {
            arc.mid = { x: getNumber(mid, 0), y: getNumber(mid, 1) }
          }
          if (angleNode) {
            arc.angle = getNumber(angleNode, 0)
          }
          graphics.push(arc)
        }
        break
      }
      case 'fp_text': {
        const textNode = child as SExpr
        const text = getString(textNode, 1)
        const at = findChild(textNode, 'at')
        const effects = findChild(textNode, 'effects')
        const font = effects ? findChild(effects, 'font') : undefined
        const size = font ? findChild(font, 'size') : undefined
        if (at) {
          graphics.push({
            type: 'text',
            text,
            at: { x: getNumber(at, 0), y: getNumber(at, 1) },
            size: size ? { x: getNumber(size, 0), y: getNumber(size, 1) } : { x: 1, y: 1 },
            thickness: (font && findChild(font, 'thickness')) ? getNumber(findChild(font, 'thickness')!, 0) : 0.15,
            layer,
          })
        }
        break
      }
    }
  }
  return graphics
}

function getLayers(node: SExpr): string[] {
  const layers = findChild(node, 'layers')
  if (!layers) return []
  return layers.children.map(c => String(c))
}

function inferCategory(name: string): PartCategory {
  const lower = name.toLowerCase()
  if (lower.includes('pot') || lower.includes('alpha') || lower.includes('alps') || lower.includes('rk09') || lower.includes('rk097')) return 'pot'
  if (lower.includes('jack') || lower.includes('pj301') || lower.includes('thonkiconn') || lower.includes('pj398')) return 'jack'
  if (lower.includes('switch') || lower.includes('tl1105') || lower.includes('b3w9') || lower.includes('lp4')) return 'switch'
  if (lower.includes('led') || lower.includes('rgb')) return 'led'
  if (lower.includes('mount') || lower.includes('hole') || lower.includes('mousebite')) return 'mounting_hole'
  if (lower.includes('header') || lower.includes('shdr') || lower.includes('pin')) return 'header'
  if (lower.includes('fuse')) return 'fuse'
  return 'other'
}

function inferLayerType(category: PartCategory, name: string): LayerType {
  if (category === 'mounting_hole' || name.toLowerCase().includes('hole')) return 'panel'
  if (category === 'pot' || category === 'jack' || category === 'switch' || category === 'led' || category === 'header' || category === 'fuse') return 'pcb_components'
  if (name.toLowerCase().includes('knob') || name.toLowerCase().includes('davies') || name.toLowerCase().includes('knurl')) return 'interface'
  return 'pcb_components'
}

function computeDimensions(pads: KiCadPad[]): { width: number; height: number; depth: number } {
  if (pads.length === 0) return { width: 10, height: 10, depth: 0 }
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  for (const p of pads) {
    if (p.at.x - p.size.x / 2 < minX) minX = p.at.x - p.size.x / 2
    if (p.at.x + p.size.x / 2 > maxX) maxX = p.at.x + p.size.x / 2
    if (p.at.y - p.size.y / 2 < minY) minY = p.at.y - p.size.y / 2
    if (p.at.y + p.size.y / 2 > maxY) maxY = p.at.y + p.size.y / 2
  }
  return {
    width: Math.ceil((maxX - minX) * 100) / 100 || 10,
    height: Math.ceil((maxY - minY) * 100) / 100 || 10,
    depth: 0,
  }
}

function normalizeLayerName(layer: string): string {
  if (layer === '*.Cu' || layer === 'F.Cu' || layer === 'B.Cu') return '*.Cu'
  return layer
}

export function mapToKiCadFootprint(sexpr: SExpr): KiCadFootprint {
  const name = getString(sexpr, 0)
  const pads: KiCadPad[] = []
  const models: KiCadModel[] = []

  for (const child of sexpr.children) {
    if (typeof child !== 'object' || child.name !== 'pad') continue
    const padNode = child as SExpr
    const pad: KiCadPad = {
      number: getString(padNode, 0),
      type: getString(padNode, 1),
      shape: getString(padNode, 2),
      at: getAt(padNode),
      size: getSize(padNode),
      drill: getDrill(padNode),
      layers: getLayers(padNode),
    }
    pads.push(pad)
  }

  for (const child of sexpr.children) {
    if (typeof child !== 'object' || child.name !== 'model') continue
    const modelNode = child as SExpr
    const model: KiCadModel = {
      path: getString(modelNode, 0),
      offset: getModelVec(modelNode, 'offset'),
      scale: getModelVec(modelNode, 'scale'),
      rotate: getModelVec(modelNode, 'rotate'),
    }
    models.push(model)
  }

  const graphics = parseGraphics(sexpr)
  return { name, pads, models, graphics }
}

export function mapToPart(sexpr: SExpr): Part {
  const footprint = mapToKiCadFootprint(sexpr)
  const category = inferCategory(footprint.name)
  const dims = computeDimensions(footprint.pads)

  const panelCutout = findPanelCutout(footprint)

  return {
    id: crypto.randomUUID(),
    name: footprint.name,
    category,
    layerType: inferLayerType(category, footprint.name),
    footprint: {
      name: footprint.name,
      pads: footprint.pads.map(p => ({
        number: p.number,
        type: p.type as Pad['type'],
        shape: p.shape as Pad['shape'],
        x: p.at.x,
        y: p.at.y,
        width: p.size.x,
        height: p.size.y,
        drill: p.drill,
        layers: p.layers.map(normalizeLayerName),
      })),
      models: footprint.models.map(m => m.path),
      graphics: footprint.graphics.map(g => {
        switch (g.type) {
          case 'line':
            return { type: 'line' as const, x1: g.start.x, y1: g.start.y, x2: g.end.x, y2: g.end.y, width: g.width }
          case 'circle':
            return { type: 'circle' as const, cx: g.center.x, cy: g.center.y, radius: Math.sqrt((g.end.x - g.center.x) ** 2 + (g.end.y - g.center.y) ** 2), width: g.width }
          case 'arc':
            return { type: 'arc' as const, x1: g.start.x, y1: g.start.y, x2: g.end.x, y2: g.end.y, mid: g.mid, angle: g.angle, width: g.width }
          case 'text':
            return { type: 'text' as const, text: g.text, x: g.at.x, y: g.at.y, size: g.size.x }
        }
      }),
    },
    panelCutout,
    dimensions: dims,
  }
}

function findPanelCutout(footprint: KiCadFootprint): Part['panelCutout'] {
  const isPanelHole = footprint.name.toLowerCase().includes('hole') || footprint.name.toLowerCase().includes('mount')
  if (!isPanelHole) return undefined
  for (const pad of footprint.pads) {
    if (pad.shape === 'circle' && typeof pad.drill === 'number' && pad.drill > 0) {
      return { type: 'circle', width: pad.drill, height: pad.drill, x: pad.at.x, y: pad.at.y }
    }
  }
  return undefined
}

export async function parseKicadMod(text: string, filename?: string): Promise<Part> {
  const { tokenize } = await import('./lexer')
  const { parse } = await import('./parser')
  const tokens = tokenize(text)
  const exprs = parse(tokens)

  const footprint = exprs.find(e => e.name === 'footprint' || e.name === 'module')
  if (!footprint) throw new Error(`No footprint or module found in ${filename || 'file'}`)

  return mapToPart(footprint)
}
