import { parseKicadMod } from '../parsers/kicad'
import type { Part } from './types/part'
import { SAMPLE_PARTS } from './sample-parts'
import { PART_PAIRINGS } from './part-pairings'

const modFiles = import.meta.glob('/parts/Eurocad.pretty/*.kicad_mod', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function applyPairings(parts: Part[]): void {
  for (const part of parts) {
    const pairedName = PART_PAIRINGS[part.name]
    if (pairedName) {
      const pairedPart = parts.find(p => p.name === pairedName)
      if (pairedPart) {
        part.pairedPanelPartId = pairedPart.id
      }
    }
  }
}

let cachedParts: Part[] | null = null

export async function getLibraryParts(): Promise<Part[]> {
  if (cachedParts) return cachedParts
  const parts: Part[] = []
  for (const [path, content] of Object.entries(modFiles)) {
    try {
      const filename = path.split('/').pop() ?? 'unknown.kicad_mod'
      const part = await parseKicadMod(content as string, filename)
      parts.push(part)
    } catch {
      console.warn(`Skipping unparseable part: ${path}`)
    }
  }
  if (parts.length === 0) {
    cachedParts = SAMPLE_PARTS
    return cachedParts
  }
  applyPairings(parts)
  const existingNames = new Set(parts.map(p => p.name))
  for (const sp of SAMPLE_PARTS) {
    if (!existingNames.has(sp.name)) {
      parts.push(sp)
    }
  }
  cachedParts = parts
  return parts
}
