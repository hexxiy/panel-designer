import { Rect } from 'react-konva'
import { useMemo } from 'react'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import { panelToStage } from './panelView'
import { snapToGrid } from './panelView'

interface PlacementGhostProps {
  mousePanelPos: { x: number; y: number } | null
  activePartId: string | null
  activeGroupId: string | null
  panelHeight: number
  panX: number
  panY: number
  zoom: number
  valid: boolean
  activeTool: string
  textLayer: 'silkscreen' | 'copper'
}

export function PlacementGhost({ mousePanelPos, activePartId, activeGroupId, panelHeight, panX, panY, zoom, valid, activeTool, textLayer }: PlacementGhostProps) {
  const parts = usePartsLibraryStore(s => s.parts)
  const groups = usePartsLibraryStore(s => s.groups)

  const ghost = useMemo(() => {
    if (!mousePanelPos) return null

    if (activeGroupId) {
      const group = groups.find(g => g.id === activeGroupId)
      if (!group) return null
      const snappedX = snapToGrid(mousePanelPos.x, 5.08)
      const snappedY = snapToGrid(mousePanelPos.y, 5)
      const pos = panelToStage(snappedX, snappedY, panelHeight, panX, panY, zoom)
      return {
        x: pos.x,
        y: pos.y,
        w: group.dimensions.width * zoom,
        h: group.dimensions.height * zoom,
      }
    }

    if (activeTool === 'text') {
      const snappedX = snapToGrid(mousePanelPos.x, 5.08)
      const snappedY = snapToGrid(mousePanelPos.y, 5)
      const pos = panelToStage(snappedX, snappedY, panelHeight, panX, panY, zoom)
      return {
        x: pos.x,
        y: pos.y,
        w: 20 * zoom,
        h: 6 * zoom,
      }
    }

    if (!activePartId) return null
    const part = parts.find(p => p.id === activePartId)
    if (!part) return null

    const snappedX = snapToGrid(mousePanelPos.x, 5.08)
    const snappedY = snapToGrid(mousePanelPos.y, 5)
    const pos = panelToStage(snappedX, snappedY, panelHeight, panX, panY, zoom)

    return {
      x: pos.x,
      y: pos.y,
      w: part.dimensions.width * zoom,
      h: part.dimensions.height * zoom,
    }
  }, [mousePanelPos, activePartId, activeGroupId, parts, groups, panelHeight, panX, panY, zoom, activeTool, textLayer])

  if (!ghost) return null

  const fillColor = valid ? 'rgba(100,220,100,0.1)' : 'rgba(220,100,100,0.15)'
  const strokeColor = valid ? 'rgba(100,220,100,0.4)' : 'rgba(220,100,100,0.5)'

  return (
    <Rect
      x={ghost.x - ghost.w / 2}
      y={ghost.y - ghost.h / 2}
      width={ghost.w}
      height={ghost.h}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={1}
      dash={[4, 4]}
      listening={false}
    />
  )
}