import { describe, it, expect } from 'vitest'
import { hpToMm, mmToHp, mmToInch, inchToMm, roundTo, formatMm, formatHp } from '../units'

describe('units', () => {
  it('converts HP to mm', () => {
    expect(hpToMm(1)).toBe(5.08)
    expect(hpToMm(10)).toBe(50.8)
    expect(hpToMm(84)).toBe(426.72)
  })

  it('converts mm to HP', () => {
    expect(mmToHp(5.08)).toBeCloseTo(1)
    expect(mmToHp(50.8)).toBeCloseTo(10)
  })

  it('converts mm to inch and back', () => {
    expect(mmToInch(25.4)).toBeCloseTo(1)
    expect(inchToMm(1)).toBeCloseTo(25.4)
    expect(inchToMm(mmToInch(100))).toBeCloseTo(100)
  })

  it('rounds to specified decimals', () => {
    expect(roundTo(5.089, 2)).toBe(5.09)
    expect(roundTo(5.081, 1)).toBe(5.1)
  })

  it('formats values with units', () => {
    expect(formatMm(128.5)).toBe('128.50 mm')
    expect(formatHp(10)).toBe('10.0 HP')
  })
})
