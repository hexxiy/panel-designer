import { describe, it, expect } from 'vitest'
import { computeMountingHoles } from '../panel-utils'
import { getFormat } from '../standards'

describe('computeMountingHoles', () => {
  const eurorack = getFormat('eurorack')

  it('returns 2 holes for narrow panels', () => {
    const holes = computeMountingHoles(9.8, 128.5, eurorack)
    expect(holes).toHaveLength(2)
  })

  it('returns 4 holes for wide panels', () => {
    const holes = computeMountingHoles(50.5, 128.5, eurorack)
    expect(holes).toHaveLength(4)
  })

  it('positions holes 7.5mm from vertical edges for 4-hole layout', () => {
    const holes = computeMountingHoles(50.5, 128.5, eurorack)
    const leftHoles = holes.filter(h => h.x === 7.5)
    const rightHoles = holes.filter(h => h.x === 50.5 - 7.5)
    expect(leftHoles).toHaveLength(2)
    expect(rightHoles).toHaveLength(2)
  })

  it('positions top holes at yFromTop and bottom holes at height - yFromBottom', () => {
    const holes = computeMountingHoles(50.5, 128.5, eurorack)
    const topHoles = holes.filter(h => h.y === 3)
    const bottomHoles = holes.filter(h => h.y === 128.5 - 3)
    expect(topHoles).toHaveLength(2)
    expect(bottomHoles).toHaveLength(2)
  })

  it('centers holes horizontally for 2-hole layout', () => {
    const holes = computeMountingHoles(9.8, 128.5, eurorack)
    expect(holes[0].x).toBe(9.8 / 2)
    expect(holes[1].x).toBe(9.8 / 2)
  })

  it('uses correct hole diameter', () => {
    const holes = computeMountingHoles(50.5, 128.5, eurorack)
    holes.forEach(h => expect(h.diameter).toBe(3.2))
  })
})
