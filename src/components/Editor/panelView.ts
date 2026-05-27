export function panelToStage(
  px: number, py: number,
  panelHeight: number,
  panX: number, panY: number, zoom: number,
): { x: number; y: number } {
  return {
    x: panX + px * zoom,
    y: panY + (panelHeight - py) * zoom,
  }
}

export function stageToPanel(
  sx: number, sy: number,
  panelHeight: number,
  panX: number, panY: number, zoom: number,
): { x: number; y: number } {
  return {
    x: (sx - panX) / zoom,
    y: panelHeight - (sy - panY) / zoom,
  }
}

export function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize
}
