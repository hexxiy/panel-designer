export const HP_TO_MM = 5.08
export const MM_TO_INCH = 1 / 25.4

export function hpToMm(hp: number): number {
  return hp * HP_TO_MM
}

export function mmToHp(mm: number): number {
  return mm / HP_TO_MM
}

export function mmToInch(mm: number): number {
  return mm * MM_TO_INCH
}

export function inchToMm(inch: number): number {
  return inch / MM_TO_INCH
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function formatMm(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} mm`
}

export function formatHp(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)} HP`
}
