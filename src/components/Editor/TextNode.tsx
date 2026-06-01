import { Group, Rect, Text } from 'react-konva'
import type { TextPlacement } from '../../core/types/panel'
import { panelToStage } from './panelView'

const TEXT_W = 20
const TEXT_H = 6

interface TextNodeProps {
  textPlacement: TextPlacement
  panelHeight: number
  panX: number
  panY: number
  zoom: number
  selected: boolean
  layerType: string
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

export function TextNode({
  textPlacement, panelHeight,
  panX, panY, zoom, selected,
  layerType, onSelect, onDragEnd,
}: TextNodeProps) {
  const { x: sx, y: sy } = panelToStage(textPlacement.x, textPlacement.y, panelHeight, panX, panY, zoom)
  const w = TEXT_W * zoom
  const h = TEXT_H * zoom
  const color = layerType === 'pcb_components' ? '#c07a3a' : '#fff'

  return (
    <Group
      x={sx}
      y={sy}
      rotation={-textPlacement.rotation}
      draggable={!textPlacement.locked}
      onClick={() => onSelect(textPlacement.id)}
      onTap={() => onSelect(textPlacement.id)}
      onDragEnd={(e) => {
        const newX = (e.target.x() - panX) / zoom
        const newY = panelHeight - (e.target.y() - panY) / zoom
        onDragEnd(textPlacement.id, newX, newY)
      }}
    >
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill={color}
        opacity={0.08}
        stroke={selected ? '#fff' : 'transparent'}
        strokeWidth={selected ? 2 / zoom : 0}
        cornerRadius={1}
      />
      <Text
        x={-w / 2 + 2}
        y={-h / 2 + 2}
        text={textPlacement.label}
        fontSize={textPlacement.fontSize * zoom}
        fill={color}
        listening={false}
      />
    </Group>
  )
}
