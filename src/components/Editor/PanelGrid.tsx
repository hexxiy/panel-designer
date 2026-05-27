import { Line } from 'react-konva'
import { useThemeStore } from '../../stores/themeStore'

interface PanelGridProps {
  widthMm: number
  heightMm: number
  panX: number
  panY: number
  zoom: number
}

export function PanelGrid({ widthMm, heightMm, panX, panY, zoom }: PanelGridProps) {
  const themeId = useThemeStore(s => s.themeId)
  const gridColor = themeId === 'light' ? '#e0e0e0' : '#2a2a2a'

  const lines: { x: number; y: number; length: number; horizontal: boolean }[] = []

  const xStep = 5.08 * zoom
  const yStep = 5 * zoom

  for (let i = 0; i <= Math.ceil(widthMm / 5.08); i++) {
    const x = panX + i * xStep
    lines.push({ x, y: panY, length: heightMm * zoom, horizontal: false })
  }

  for (let i = 0; i <= Math.ceil(heightMm / 5); i++) {
    const y = panY + i * yStep
    lines.push({ x: panX, y, length: widthMm * zoom, horizontal: true })
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
