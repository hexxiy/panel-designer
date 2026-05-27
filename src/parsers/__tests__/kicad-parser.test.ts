import { describe, it, expect } from 'vitest'
import { tokenize } from '../kicad/lexer'
import { parse } from '../kicad/parser'
import { mapToPart } from '../kicad/mapper'

const SAMPLE_MODERN = `(footprint "PJ301M-12" (version 20221018) (generator pcbnew)
  (layer "F.Cu")
  (attr through_hole)
  (fp_text reference "REF**" (at 4.064 5.588) (layer "F.SilkS")
    (effects (font (size 1 1) (thickness 0.15))))
  (pad "1" thru_hole circle (at 0 6.48) (size 1.8 1.8) (drill 1.02) (layers "*.Cu" "*.Mask" "F.SilkS"))
  (pad "2" thru_hole circle (at 0 3.38) (size 1.8 1.8) (drill 1.02) (layers "*.Cu" "*.Mask" "F.SilkS"))
  (model "PJ301M-12.stp"
    (offset (xyz 0 0.75 0))
    (scale (xyz 1 1 1))
    (rotate (xyz 0 0 0))))`

const SAMPLE_LEGACY = `(module mounting_hole (layer F.Cu) (tedit 5E1E93BD)
  (fp_text reference REF** (at 0 0.5) (layer F.SilkS)
    (effects (font (size 1 1) (thickness 0.15))))
  (fp_text value mounting_hole (at 0 -0.5) (layer F.Fab)
    (effects (font (size 1 1) (thickness 0.15))))
  (pad 1 thru_hole circle (at 0 0) (size 4 4) (drill 3.2) (layers *.Cu *.Mask)))`

describe('KiCad lexer', () => {
  it('tokenizes parentheses', () => {
    const tokens = tokenize('(hello world)')
    expect(tokens[0].type).toBe('lparen')
    expect(tokens[tokens.length - 1].type).toBe('rparen')
  })

  it('tokenizes strings', () => {
    const tokens = tokenize('("hello" "world")')
    expect(tokens[1]).toEqual({ type: 'string', value: 'hello' })
    expect(tokens[2]).toEqual({ type: 'string', value: 'world' })
  })

  it('tokenizes numbers', () => {
    const tokens = tokenize('(42 -3.14)')
    const nums = tokens.filter(t => t.type === 'number') as { type: 'number'; value: number }[]
    expect(nums[0].value).toBe(42)
    expect(nums[1].value).toBe(-3.14)
  })

  it('skips comments', () => {
    const tokens = tokenize('(a ; this is a comment\n b)')
    const symbols = tokens.filter(t => t.type === 'symbol')
    expect(symbols.map(s => s.value)).toEqual(['a', 'b'])
  })
})

describe('KiCad parser', () => {
  it('parses modern footprint format', () => {
    const tokens = tokenize(SAMPLE_MODERN)
    const exprs = parse(tokens)
    expect(exprs).toHaveLength(1)
    expect(exprs[0].name).toBe('footprint')
  })

  it('parses legacy module format', () => {
    const tokens = tokenize(SAMPLE_LEGACY)
    const exprs = parse(tokens)
    expect(exprs).toHaveLength(1)
    expect(exprs[0].name).toBe('module')
  })
})

describe('KiCad mapper', () => {
  it('maps modern footprint to Part', () => {
    const tokens = tokenize(SAMPLE_MODERN)
    const exprs = parse(tokens)
    const part = mapToPart(exprs[0])
    expect(part.name).toBe('PJ301M-12')
    expect(part.category).toBe('jack')
    expect(part.layerType).toBe('pcb_components')
    expect(part.footprint?.pads).toHaveLength(2)
    expect(part.footprint?.models).toHaveLength(1)
    expect(part.footprint?.models[0]).toBe('PJ301M-12.stp')
  })

  it('maps legacy module to Part', () => {
    const tokens = tokenize(SAMPLE_LEGACY)
    const exprs = parse(tokens)
    const part = mapToPart(exprs[0])
    expect(part.name).toBe('mounting_hole')
    expect(part.category).toBe('mounting_hole')
    expect(part.layerType).toBe('panel')
    expect(part.footprint?.pads).toHaveLength(1)
    expect(part.footprint?.pads[0].drill).toBe(3.2)
  })

  it('extracts panel cutout from mounting holes', () => {
    const tokens = tokenize(SAMPLE_LEGACY)
    const exprs = parse(tokens)
    const part = mapToPart(exprs[0])
    expect(part.panelCutout).toBeDefined()
    expect(part.panelCutout?.type).toBe('circle')
    expect(part.panelCutout?.width).toBe(3.2)
  })

  it('infers dimensions from pads', () => {
    const tokens = tokenize(SAMPLE_MODERN)
    const exprs = parse(tokens)
    const part = mapToPart(exprs[0])
    expect(part.dimensions.width).toBeGreaterThan(0)
    expect(part.dimensions.height).toBeGreaterThan(0)
  })
})
