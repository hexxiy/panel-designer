import { Circle } from 'react-konva'
import { useMemo } from 'react'
import { getFormat } from '../../core'
import { computeMountingHoles } from '../../core/panel-utils'
import { panelToStage } from './panelView'

interface MountingHolesProps {
  formatId: string
  widthMm: number
  heightMm: number
  panX: number
  panY: number
  zoom: number
}

export function MountingHoles({ formatId, widthMm, heightMm, panX, panY, zoom }: MountingHolesProps) {
  const format = getFormat(formatId as any)
  const holes = useMemo(() => computeMountingHoles(widthMm, heightMm, format), [widthMm, heightMm, format])

  return (
    <>
      {holes.map((hole, i) => {
        const pos = panelToStage(hole.x, hole.y, heightMm, panX, panY, zoom)
        return (
          <Circle
            key={i}
            x={pos.x}
            y={pos.y}
            radius={(hole.diameter / 2) * zoom}
            stroke="var(--color-text-dim)"
            strokeWidth={1}
            listening={false}
          />
        )
      })}
    </>
  )
}
