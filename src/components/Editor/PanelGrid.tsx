import { Line } from 'react-konva'
import { useThemeStore } from '../../stores/themeStore'

interface PanelGridProps {
  stageW: number
  stageH: number
  panX: number
  panY: number
  zoom: number
  showGrid: boolean
  gridSize: number
}

export function PanelGrid({ stageW, stageH, panX, panY, zoom, gridSize }: PanelGridProps) {
  const themeId = useThemeStore(s => s.themeId)
  const gridColor = themeId === 'light' ? '#e0e0e0' : '#2a2a2a'

  const step = gridSize * zoom

  const viewLeft = -panX / zoom
  const viewTop = -panY / zoom
  const viewRight = (-panX + stageW) / zoom
  const viewBottom = (-panY + stageH) / zoom

  const startCol = Math.floor(viewLeft / gridSize)
  const endCol = Math.ceil(viewRight / gridSize)
  const startRow = Math.floor(viewTop / gridSize)
  const endRow = Math.ceil(viewBottom / gridSize)

  const lines: { x: number; y: number; length: number; horizontal: boolean }[] = []

  const viewW = stageW
  const viewH = stageH

  for (let i = startCol; i <= endCol; i++) {
    const x = panX + i * step
    lines.push({ x, y: 0, length: viewH, horizontal: false })
  }

  for (let i = startRow; i <= endRow; i++) {
    const y = panY + i * step
    lines.push({ x: 0, y, length: viewW, horizontal: true })
  }

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.horizontal
            ? [line.x, line.y, line.x + line.length, line.y]
            : [line.x, line.y, line.x, line.y + line.length]
          }
          stroke={gridColor}
          strokeWidth={0.5}
          listening={false}
        />
      ))}
    </>
  )
}
