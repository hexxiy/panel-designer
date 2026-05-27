import type { Part, LayerType } from './types/part'

export function findPairedParts(part: Part, allParts: Part[]): { part: Part; layerType: LayerType }[] {
  if (!part.couplingGroup) return []
  return allParts
    .filter(p => p.couplingGroup === part.couplingGroup && p.id !== part.id)
    .map(p => ({ part: p, layerType: p.layerType }))
}

export function findPanelCutoutPart(part: Part, allParts: Part[]): Part | undefined {
  if (part.panelCutout) return part
  return allParts.find(
    p => p.couplingGroup === part.couplingGroup && p.layerType === 'panel'
  )
}

export function getPlacementLayers(part: Part, allParts: Part[]): LayerType[] {
  const layers = [part.layerType]
  for (const paired of findPairedParts(part, allParts)) {
    if (!layers.includes(paired.layerType)) layers.push(paired.layerType)
  }
  return layers
}
