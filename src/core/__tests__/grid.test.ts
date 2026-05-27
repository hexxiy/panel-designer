import { describe, it, expect } from 'vitest'
import { snapToGrid, hpToGridX, boxesOverlap, placementWithinBounds, getPartBoundingBox, DEFAULT_GRID_CONFIG } from '../grid'

describe('grid', () => {
  it('snaps to grid', () => {
    const result = snapToGrid({ x: 11, y: 7.3 }, DEFAULT_GRID_CONFIG)
    expect(result.x).toBe(10.16)
    expect(result.y).toBe(5)
  })

  it('converts HP to grid X', () => {
    expect(hpToGridX(1)).toBe(5.08)
    expect(hpToGridX(4)).toBe(20.32)
  })

  it('detects overlap', () => {
    const a = getPartBoundingBox(10, 10, 5, 5)
    const b = getPartBoundingBox(10, 10, 5, 5)
    expect(boxesOverlap(a, b)).toBe(true)
  })

  it('detects no overlap', () => {
    const a = getPartBoundingBox(0, 0, 5, 5)
    const b = getPartBoundingBox(100, 100, 5, 5)
    expect(boxesOverlap(a, b)).toBe(false)
  })

  it('checks placement within bounds', () => {
    expect(placementWithinBounds(50, 64.25, 5, 5, 100, 128.5, 1)).toBe(true)
    expect(placementWithinBounds(-1, 64.25, 5, 5, 100, 128.5, 1)).toBe(false)
    expect(placementWithinBounds(50, -1, 5, 5, 100, 128.5, 1)).toBe(false)
    expect(placementWithinBounds(101, 64.25, 5, 5, 100, 128.5, 1)).toBe(false)
  })
})
