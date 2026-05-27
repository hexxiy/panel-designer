import { Group, Rect, Circle, Text } from 'react-konva'
import type { Placement } from '../../core/types/panel'
import type { Part } from '../../core/types/part'
import { panelToStage } from './panelView'

interface PlacementNodeProps {
  placement: Placement
  part: Part
  panelHeight: number
  panX: number
  panY: number
  zoom: number
  selected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number, partId: string) => void
}

const LAYER_COLORS: Record<string, string> = {
  interface: '#d4a017',
  panel: '#8a8a8a',
  pcb_components: '#3a8a9a',
}

export function PlacementNode({
  placement, part, panelHeight,
  panX, panY, zoom, selected,
  onSelect, onDragEnd,
}: PlacementNodeProps) {
  const { x: sx, y: sy } = panelToStage(placement.x, placement.y, panelHeight, panX, panY, zoom)
  const w = part.dimensions.width * zoom
  const h = part.dimensions.height * zoom
  const color = LAYER_COLORS[part.layerType] || '#888'

  return (
    <Group
      x={sx}
      y={sy}
      rotation={-placement.rotation}
      offsetX={0}
      offsetY={0}
      draggable={!placement.locked}
      onClick={() => onSelect(placement.id)}
      onTap={() => onSelect(placement.id)}
      onDragEnd={(e) => {
        const newX = (e.target.x() - panX) / zoom
        const newY = panelHeight - (e.target.y() - panY) / zoom
        onDragEnd(placement.id, newX, newY, part.id)
      }}
    >
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill={color}
        opacity={0.25}
        stroke={selected ? '#fff' : color}
        strokeWidth={selected ? 2 / zoom : 1 / zoom}
        cornerRadius={1}
        listening={false}
      />
      <Text
        x={-80}
        y={-h / 2 - 10}
        width={160}
        text={part.name}
        fontSize={Math.max(6, Math.min(10, 10 / zoom))}
        fill={color}
        align="center"
        listening={false}
      />
      {part.panelCutout && part.panelCutout.type === 'circle' && (
        <Circle
          x={part.panelCutout.x * zoom}
          y={(-part.panelCutout.y) * zoom}
          radius={part.panelCutout.width / 2 * zoom}
          stroke={selected ? '#fff' : color}
          strokeWidth={1 / zoom}
          listening={false}
        />
      )}
    </Group>
  )
}
