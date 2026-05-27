import { describe, it, expect } from 'vitest'
import { createLayer, createPanel } from '../types/panel'

describe('panel types', () => {
  it('creates a layer with defaults', () => {
    const layer = createLayer('interface', 'Test Layer')
    expect(layer.type).toBe('interface')
    expect(layer.visible).toBe(true)
    expect(layer.locked).toBe(false)
    expect(layer.placements).toEqual([])
  })

  it('creates a panel with 3 layers', () => {
    const panel = createPanel('eurorack', 10, 50.5, 128.5)
    expect(panel.format).toBe('eurorack')
    expect(panel.dimensions.hp).toBe(10)
    expect(panel.dimensions.actualWidthMm).toBe(50.5)
    expect(panel.dimensions.heightMm).toBe(128.5)
    expect(panel.layers).toHaveLength(3)
    expect(panel.layers[0].type).toBe('interface')
    expect(panel.layers[1].type).toBe('panel')
    expect(panel.layers[2].type).toBe('pcb_components')
    expect(panel.pairings).toEqual([])
    expect(panel.metadata.version).toBe(1)
  })
})
