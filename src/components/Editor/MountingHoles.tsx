import { Circle, Group } from 'react-konva'
import { useMemo, useCallback } from 'react'
import { getFormat } from '../../core'
import { computeMountingHoles } from '../../core/panel-utils'
import { panelToStage } from './panelView'
import { usePanelStore } from '../../stores/panelStore'
import { useUIStore } from '../../stores/uiStore'

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
  const mountingHoleOverrides = usePanelStore(s => s.panel.mountingHoleOverrides)
  const holes = useMemo(() =>
    computeMountingHoles(widthMm, heightMm, format, mountingHoleOverrides),
    [widthMm, heightMm, format, mountingHoleOverrides]
  )

  const selectedIndex = useUIStore(s => s.selectedMountingHoleIndex)
  const selectMountingHole = useUIStore(s => s.selectMountingHole)

  const handleClick = useCallback((index: number) => (e: any) => {
    e.cancelBubble = true
    selectMountingHole(selectedIndex === index ? null : index)
  }, [selectMountingHole, selectedIndex])

  return (
    <>
      {holes.map((hole, i) => {
        const pos = panelToStage(hole.x, hole.y, heightMm, panX, panY, zoom)
        const isSelected = selectedIndex === i
        return (
          <Group key={i} onClick={handleClick(i)} onTap={handleClick(i)}>
            <Circle
              x={pos.x}
              y={pos.y}
              radius={(hole.diameter / 2) * zoom}
              stroke="var(--color-text-dim)"
              strokeWidth={1}
              listening={false}
            />
            <Circle
              x={pos.x}
              y={pos.y}
              radius={(hole.ringDiameter / 2) * zoom}
              stroke="var(--color-accent)"
              strokeWidth={isSelected ? 2 : 1}
              fill={isSelected ? 'rgba(255,255,255,0.1)' : 'transparent'}
              listening={false}
            />
          </Group>
        )
      })}
    </>
  )
}
