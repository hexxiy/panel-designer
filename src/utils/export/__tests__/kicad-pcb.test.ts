import { describe, it, expect } from 'vitest'
import { createPanel } from '../../../core/types/panel'
import type { Part } from '../../../core/types/part'
import { exportKicadPcb } from '../kicad-pcb'

function makePart(name: string, category: Part['category'], layerType: Part['layerType'], w: number, h: number): Part {
  return {
    id: crypto.randomUUID(),
    name,
    category,
    layerType,
    dimensions: { width: w, height: h, depth: 10 },
    footprint: {
      name,
      pads: [
        {
          number: '1', type: 'thru_hole', shape: 'circle',
          x: 0, y: 0, width: 2, height: 2, drill: 1,
          layers: ['*.Cu', '*.Mask'],
        },
      ],
      models: [],
      graphics: [],
    },
  }
}

describe('exportKicadPcb', () => {
  it('exports a valid kicad_pcb file with header', () => {
    const panel = createPanel('eurorack', 10, 50.8, 128.5)
    const parts: Part[] = []
    const output = exportKicadPcb(panel, parts)

    expect(output).toContain('(kicad_pcb')
    expect(output).toContain('(version 20241229)')
    expect(output).toContain('(generator "panel-designer")')
    expect(output).toContain('(paper "A4")')
    expect(output).toContain('Edge.Cuts')
  })

  it('includes panel outline on Edge.Cuts', () => {
    const panel = createPanel('eurorack', 10, 50.8, 128.5)
    const output = exportKicadPcb(panel, [])

    expect(output).toContain('"Edge.Cuts"')
    expect(output).toContain('(gr_rect')
  })

  it('includes mounting holes for wide panels', () => {
    const panel = createPanel('eurorack', 20, 101.6, 128.5)
    const output = exportKicadPcb(panel, [])

    expect(output).toContain('Eurocad:mounting_hole')
    expect(output).toContain('"*.Cu"')
  })

  it('includes pcb component footprints when parts are placed', () => {
    const panel = createPanel('eurorack', 10, 50.8, 128.5)
    const part = makePart('ALPHA9MMPOT', 'pot', 'pcb_components', 10, 10)
    panel.layers[2].placements.push({
      id: crypto.randomUUID(), partId: part.id,
      x: 25.4, y: 64.25, rotation: 0, locked: false,
    })
    const output = exportKicadPcb(panel, [part])

    expect(output).toContain('(footprint')
    expect(output).toContain('ALPHA9MMPOT')
    expect(output).toContain('R1')
  })

  it('assigns refdes by category', () => {
    const panel = createPanel('eurorack', 10, 50.8, 128.5)
    const jack = makePart('PJ301M', 'jack', 'pcb_components', 10, 10)
    const pot = makePart('ALPHA9MMPOT', 'pot', 'pcb_components', 10, 10)
    panel.layers[2].placements.push(
      { id: crypto.randomUUID(), partId: jack.id, x: 10, y: 10, rotation: 0, locked: false },
      { id: crypto.randomUUID(), partId: pot.id, x: 30, y: 10, rotation: 0, locked: false },
    )
    const output = exportKicadPcb(panel, [jack, pot])

    expect(output).toContain('J1')
    expect(output).toContain('R1')
  })

  it('handles empty panel without crash', () => {
    const panel = createPanel('4u', 10, 50.8, 177.8)
    expect(() => exportKicadPcb(panel, [])).not.toThrow()
  })
})
