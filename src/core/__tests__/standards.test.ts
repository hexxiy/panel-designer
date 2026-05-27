import { describe, it, expect } from 'vitest'
import { eurorack, fourU, buchla, getFormat } from '../standards'

describe('Eurorack standard', () => {
  it('has correct height', () => {
    expect(eurorack.heightMm).toBe(128.5)
  })

  it('has correct HP width', () => {
    expect(eurorack.hpWidthMm).toBe(5.08)
  })

  it('has correct PCB height', () => {
    expect(eurorack.pcbHeightMm).toBe(108.5)
  })

  it('has correct rail margins (10mm each)', () => {
    expect(eurorack.railMarginTop).toBe(10)
    expect(eurorack.railMarginBottom).toBe(10)
  })

  it('mounting holes 7.5mm from vertical edge', () => {
    expect(eurorack.mountingHole.xFromEdge).toBe(7.5)
  })

  it('mounting hole diameter 3.2mm', () => {
    expect(eurorack.mountingHole.diameter).toBe(3.2)
  })

  it('returns actual width from Doepfer table for standard sizes', () => {
    expect(eurorack.getActualWidth(2)).toBe(9.80)
    expect(eurorack.getActualWidth(4)).toBe(20.00)
    expect(eurorack.getActualWidth(6)).toBe(30.00)
    expect(eurorack.getActualWidth(10)).toBe(50.50)
    expect(eurorack.getActualWidth(12)).toBe(60.60)
    expect(eurorack.getActualWidth(42)).toBe(213.00)
  })

  it('interpolates actual width for non-table sizes', () => {
    const hp3 = eurorack.getActualWidth(3)
    expect(hp3).toBe(3 * 5.08 - 0.3)
    const hp5 = eurorack.getActualWidth(5)
    expect(hp5).toBe(5 * 5.08 - 0.3)
    const hp30 = eurorack.getActualWidth(30)
    expect(hp30).toBe(30 * 5.08 - 0.4)
  })
})

describe('4U standard', () => {
  it('has correct height', () => {
    expect(fourU.heightMm).toBe(177.8)
  })

  it('has correct PCB height', () => {
    expect(fourU.pcbHeightMm).toBe(157.8)
  })
})

describe('Buchla standard', () => {
  it('has correct height', () => {
    expect(buchla.heightMm).toBe(177.8)
  })

  it('has correct PCB height', () => {
    expect(buchla.pcbHeightMm).toBe(152.4)
  })
})

describe('getFormat', () => {
  it('returns correct format by id', () => {
    expect(getFormat('eurorack').heightMm).toBe(128.5)
    expect(getFormat('4u').heightMm).toBe(177.8)
    expect(getFormat('buchla').heightMm).toBe(177.8)
  })
})
