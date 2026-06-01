import { Group, Rect, Circle, Ellipse, Line, Text } from 'react-konva'
import type { Placement } from '../../core/types/panel'
import type { Part, Pad } from '../../core/types/part'
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
const COPPER_COLOR = '#c07a3a'

function getArcPoints(
  x1: number, y1: number,
  x2: number, y2: number,
  mid?: { x: number; y: number },
): Array<{ x: number; y: number }> {
  if (!mid) return [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  const d = 2 * (x1 * (mid.y - y2) + mid.x * (y2 - y1) + x2 * (y1 - mid.y))
  if (Math.abs(d) < 0.001) return [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  const cx = ((x1 * x1 + y1 * y1) * (mid.y - y2) + (mid.x * mid.x + mid.y * mid.y) * (y2 - y1) + (x2 * x2 + y2 * y2) * (y1 - mid.y)) / d
  const cy = ((x1 * x1 + y1 * y1) * (x2 - mid.x) + (mid.x * mid.x + mid.y * mid.y) * (x1 - x2) + (x2 * x2 + y2 * y2) * (mid.x - x1)) / d
  const radius = Math.sqrt((x1 - cx) ** 2 + (y1 - cy) ** 2)
  const startAngle = Math.atan2(y1 - cy, x1 - cx)
  const endAngle = Math.atan2(y2 - cy, x2 - cx)
  const steps = 32
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps)
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) })
  }
  return pts
}

function SilkscreenGraphics({ graphics, zoom, color }: { graphics: import('../../core/types/part').GraphicItem[]; zoom: number; color: string }) {
  return (
    <>
      {graphics.map((g, i) => {
        switch (g.type) {
          case 'line':
            return (
              <Line
                key={i}
                x={0} y={0}
                points={[g.x1 * zoom, -g.y1 * zoom, g.x2 * zoom, -g.y2 * zoom]}
                stroke={color}
                strokeWidth={Math.max(0.5, g.width * zoom)}
                listening={false}
              />
            )
          case 'circle':
            return (
              <Circle
                key={i}
                x={g.cx * zoom}
                y={-g.cy * zoom}
                radius={g.radius * zoom}
                fill={g.fill ?? undefined}
                stroke={color}
                strokeWidth={Math.max(0.5, g.width * zoom)}
                listening={false}
              />
            )
          case 'arc': {
            const pts = getArcPoints(g.x1, g.y1, g.x2, g.y2, g.mid)
            const flat: number[] = []
            for (const p of pts) {
              flat.push(p.x * zoom, -p.y * zoom)
            }
            return (
              <Line
                key={i}
                x={0} y={0}
                points={flat}
                stroke={color}
                strokeWidth={Math.max(0.5, g.width * zoom)}
                listening={false}
              />
            )
          }
          case 'text':
            return (
              <Text
                key={i}
                x={g.x * zoom - 40}
                y={-g.y * zoom - 5}
                width={80}
                text={g.text}
                fontSize={Math.max(4, g.size * zoom * 0.8)}
                fill={color}
                align="center"
                listening={false}
              />
            )
        }
      })}
    </>
  )
}

function PadDrill({ pad, zoom }: { pad: Pad; zoom: number }) {
  if (pad.type !== 'thru_hole' && pad.type !== 'npth') return null
  const px = pad.x * zoom
  const py = -pad.y * zoom
  if (typeof pad.drill === 'number') {
    return (
      <Circle
        x={px} y={py}
        radius={(pad.drill / 2) * zoom}
        fill="#111"
        opacity={0.8}
        listening={false}
      />
    )
  }
  const dw = pad.drill.width * zoom
  const dh = pad.drill.height * zoom
  return (
    <Ellipse
      x={px} y={py}
      radiusX={dw / 2}
      radiusY={dh / 2}
      fill="#111"
      opacity={0.8}
      listening={false}
    />
  )
}

function PadShape({ pad, zoom, color }: { pad: Pad; zoom: number; color: string }) {
  const px = pad.x * zoom
  const py = -pad.y * zoom
  const pw = pad.width * zoom
  const ph = pad.height * zoom

  switch (pad.shape) {
    case 'circle':
      return (
        <>
          <Circle
            x={px}
            y={py}
            radius={pw / 2}
            fill={color}
            opacity={0.4}
            stroke={color}
            strokeWidth={0.5 / zoom}
            listening={false}
          />
          <PadDrill pad={pad} zoom={zoom} />
        </>
      )
    case 'oval':
      return (
        <>
          <Rect
            x={px - pw / 2}
            y={py - ph / 2}
            width={pw}
            height={ph}
            fill={color}
            opacity={0.4}
            stroke={color}
            strokeWidth={0.5 / zoom}
            cornerRadius={Math.min(pw, ph) / 2}
            listening={false}
          />
          <PadDrill pad={pad} zoom={zoom} />
        </>
      )
    default:
      return (
        <>
          <Rect
            x={px - pw / 2}
            y={py - ph / 2}
            width={pw}
            height={ph}
            fill={color}
            opacity={0.4}
            stroke={color}
            strokeWidth={0.5 / zoom}
            listening={false}
          />
          <PadDrill pad={pad} zoom={zoom} />
        </>
      )
  }
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
        opacity={0.08}
        stroke={selected ? '#fff' : 'transparent'}
        strokeWidth={selected ? 2 / zoom : 0}
        cornerRadius={1}
      />
      {part.footprint?.pads.map((pad, i) => (
        <PadShape key={i} pad={pad} zoom={zoom} color={pad.type === 'npth' ? COPPER_COLOR : color} />
      ))}
      {part.footprint && part.footprint.graphics.length > 0 && (
        <SilkscreenGraphics graphics={part.footprint.graphics} zoom={zoom} color="#fff" />
      )}
      {part.panelCutout && part.panelCutout.type === 'circle' && (
        <Circle
          x={part.panelCutout.x * zoom}
          y={(-part.panelCutout.y) * zoom}
          radius={part.panelCutout.width / 2 * zoom}
          fill={selected ? '#fff' : '#111'}
          opacity={0.85}
          stroke={selected ? '#fff' : '#555'}
          strokeWidth={1 / zoom}
          listening={false}
        />
      )}
    </Group>
  )
}
