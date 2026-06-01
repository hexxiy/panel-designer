import { useState, useCallback, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Line } from 'react-konva'
import { usePanelStore } from '../../stores/panelStore'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import { useUIStore } from '../../stores/uiStore'
import { useThemeStore } from '../../stores/themeStore'
import { snapToGrid } from './panelView'
import { MountingHoles } from './MountingHoles'
import { PanelGrid } from './PanelGrid'
import { PlacementNode } from './PlacementNode'
import { PlacementGhost } from './PlacementGhost'
import { stageToPanel } from './panelView'
import { placementWithinBounds, getPartBoundingBox, boxesOverlap, partMargin } from '../../core/grid'
import { getFormat } from '../../core'
import type { LayerType } from '../../core/types/part'

export function PanelCanvas() {
  const panel = usePanelStore(s => s.panel)
  const addPlacement = usePanelStore(s => s.addPlacement)
  const updatePlacement = usePanelStore(s => s.updatePlacement)
  const removePlacement = usePanelStore(s => s.removePlacement)
  const parts = usePartsLibraryStore(s => s.parts)
  const themeId = useThemeStore(s => s.themeId)

  const activeTool = useUIStore(s => s.activeTool)
  const activePartId = useUIStore(s => s.activePartId)
  const selectedPlacementIds = useUIStore(s => s.selectedPlacementIds)
  const zoom = useUIStore(s => s.zoom)
  const panX = useUIStore(s => s.panX)
  const panY = useUIStore(s => s.panY)
  const layerVisibility = useUIStore(s => s.layerVisibility)
  const overlayMode = useUIStore(s => s.overlayMode)
  const showGrid = useUIStore(s => s.showGrid)
  const gridSize = useUIStore(s => s.gridSize)
  const selectPlacement = useUIStore(s => s.selectPlacement)
  const selectPlacements = useUIStore(s => s.selectPlacements)
  const clearSelection = useUIStore(s => s.clearSelection)
  const setZoom = useUIStore(s => s.setZoom)
  const setPan = useUIStore(s => s.setPan)

  const { actualWidthMm: w, heightMm: h } = panel.dimensions

  const palette = useCallback((light: string, dark: string) => themeId === 'light' ? light : dark, [themeId])

  const [mousePanelPos, setMousePanelPos] = useState<{ x: number; y: number } | null>(null)
  const [isPlacementValid, setIsPlacementValid] = useState(true)
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const stageW = containerRef.current?.clientWidth ?? 800
  const stageH = containerRef.current?.clientHeight ?? 600

  useEffect(() => {
    const cw = containerRef.current?.clientWidth ?? 800
    const ch = containerRef.current?.clientHeight ?? 600
    const { actualWidthMm: pw, heightMm: ph } = panel.dimensions
    const iz = 2
    setPan((cw - pw * iz) / 2, (ch - ph * iz) / 2)
    setZoom(iz)
  }, [])

  const isLayerVisible = useCallback((type: LayerType) => {
    const layer = panel.layers.find(l => l.type === type)
    return layer ? (layerVisibility[layer.id] ?? layer.visible) : true
  }, [panel.layers, layerVisibility])

  const getLayerPlacements = useCallback((type: LayerType) => {
    return panel.layers.find(l => l.type === type)?.placements ?? []
  }, [panel.layers])

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    const oldScale = zoom
    const pointer = stage?.getPointerPosition()
    if (!pointer) return

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const factor = 1.1
    const newScale = direction > 0 ? oldScale * factor : oldScale / factor
    const clamped = Math.max(0.5, Math.min(20, newScale))

    const mouseX = pointer.x - panX
    const mouseY = pointer.y - panY
    const newPanX = pointer.x - (mouseX * clamped) / oldScale
    const newPanY = pointer.y - (mouseY * clamped) / oldScale

    setZoom(clamped)
    setPan(newPanX, newPanY)
  }, [zoom, panX, panY, setZoom, setPan])

  const handleMouseDown = useCallback((e: any) => {
    if (e.evt.button === 1) {
      isPanning.current = true
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      return
    }

    if (activeTool === 'place' && activePartId && e.target === e.target.getStage()) {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()
      if (!pointer) return

      const panelPos = stageToPanel(pointer.x, pointer.y, h, panX, panY, zoom)
      const snappedX = snapToGrid(panelPos.x, 5.08)
      const snappedY = snapToGrid(panelPos.y, 5)

      const part = parts.find(p => p.id === activePartId)
      if (!part) return

      const margin = partMargin(part)
      const halfW = part.dimensions.width / 2
      const halfH = part.dimensions.height / 2
      if (!placementWithinBounds(snappedX, snappedY, halfW, halfH, w, h, margin)) return

      const allPlacements = panel.layers.flatMap(l => l.placements)
      const newBox = getPartBoundingBox(snappedX, snappedY, halfW, halfH)
      for (const pl of allPlacements) {
        const plPart = parts.find(p => p.id === pl.partId)
        if (!plPart) continue
        const buffer = (margin + partMargin(plPart)) / 2
        const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
        if (boxesOverlap(newBox, plBox, buffer)) return
      }

      if (part.name === 'KnobAssembly') {
        const agId = crypto.randomUUID()
        const potPart = parts.find(p => p.name === 'Alpha9mmPot')
        const knobPart = parts.find(p => p.name === 'Davies1900')
        if (potPart) {
          addPlacement('pcb_components', potPart.id, snappedX, snappedY, 0, agId)
          if (potPart.pairedPanelPartId) {
            addPlacement('panel', potPart.pairedPanelPartId, snappedX, snappedY, 0, agId)
          }
        }
        if (knobPart) {
          addPlacement('interface', knobPart.id, snappedX, snappedY, 0, agId)
        }
      } else {
        const targetLayerType = part.layerType
        const pairedGroupId = (part.pairedPanelPartId || part.couplingGroup) ? crypto.randomUUID() : undefined
        addPlacement(targetLayerType, part.id, snappedX, snappedY, 0, pairedGroupId)

        if (part.couplingGroup) {
          for (const other of parts) {
            if (other.id !== part.id && other.couplingGroup === part.couplingGroup) {
              addPlacement(other.layerType, other.id, snappedX, snappedY, 0, pairedGroupId)
              if (other.pairedPanelPartId && other.layerType !== 'panel') {
                addPlacement('panel', other.pairedPanelPartId, snappedX, snappedY, 0, pairedGroupId)
              }
            }
          }
        }

        if (part.pairedPanelPartId && part.layerType !== 'panel') {
          addPlacement('panel', part.pairedPanelPartId, snappedX, snappedY, 0, pairedGroupId)
        }
      }
    }
  }, [activeTool, activePartId, h, panX, panY, zoom, w, parts, addPlacement, panel.layers])

  const handleMouseMove = useCallback((e: any) => {
    if (isPanning.current) {
      const dx = e.evt.clientX - lastPos.current.x
      const dy = e.evt.clientY - lastPos.current.y
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      setPan(panX + dx, panY + dy)
      return
    }

    if (activeTool === 'place' && activePartId) {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        const panelPos = stageToPanel(pointer.x, pointer.y, h, panX, panY, zoom)
        setMousePanelPos(panelPos)

        const part = parts.find(p => p.id === activePartId)
        if (part) {
          const sx = snapToGrid(panelPos.x, 5.08)
          const sy = snapToGrid(panelPos.y, 5)
          const margin = partMargin(part)
          const halfW = part.dimensions.width / 2
          const halfH = part.dimensions.height / 2
          const inBounds = placementWithinBounds(sx, sy, halfW, halfH, w, h, margin)
          const allPlacements = panel.layers.flatMap(l => l.placements)
          const newBox = getPartBoundingBox(sx, sy, halfW, halfH)
          const noOverlap = !allPlacements.some(pl => {
            const plPart = parts.find(p => p.id === pl.partId)
            if (!plPart) return false
            const buffer = (margin + partMargin(plPart)) / 2
            const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
            return boxesOverlap(newBox, plBox, buffer)
          })
          setIsPlacementValid(inBounds && noOverlap)
        }
      }
    }
  }, [activeTool, activePartId, h, panX, panY, zoom, setPan, w, parts, panel.layers])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleStageClick = useCallback((e: any) => {
    if (activeTool === 'select' && e.target === e.target.getStage()) {
      clearSelection()
    }
  }, [activeTool, clearSelection])

  const handlePlacementSelect = useCallback((id: string) => {
    let clickedPlacement: typeof panel.layers[0]['placements'][0] | undefined
    let clickedPart: typeof parts[0] | undefined
    for (const layer of panel.layers) {
      const found = layer.placements.find(p => p.id === id)
      if (found) {
        clickedPlacement = found
        clickedPart = parts.find(p => p.id === found.partId)
        break
      }
    }

    if (!clickedPlacement || !clickedPart) {
      selectPlacement(id)
      return
    }

    const linkedIds: string[] = [id]

    if (clickedPlacement.pairedGroupId) {
      for (const layer of panel.layers) {
        for (const pl of layer.placements) {
          if (pl.pairedGroupId === clickedPlacement.pairedGroupId && !linkedIds.includes(pl.id)) {
            linkedIds.push(pl.id)
          }
        }
      }
    }

    if (clickedPart.couplingGroup) {
      for (const layer of panel.layers) {
        for (const pl of layer.placements) {
          if (linkedIds.includes(pl.id)) continue
          const plPart = parts.find(p => p.id === pl.partId)
          if (plPart && plPart.couplingGroup === clickedPart.couplingGroup) {
            linkedIds.push(pl.id)
          }
        }
      }
    }

    if (clickedPart.pairedPanelPartId) {
      for (const layer of panel.layers) {
        for (const pl of layer.placements) {
          if (linkedIds.includes(pl.id)) continue
          const plPart = parts.find(p => p.id === pl.partId)
          if (plPart && (plPart.id === clickedPart.pairedPanelPartId || plPart.pairedPanelPartId === clickedPart.id)) {
            linkedIds.push(pl.id)
          }
        }
      }
    }

    selectPlacements(linkedIds)
  }, [selectPlacement, selectPlacements, panel.layers, parts])

  const handlePlacementDragEnd = useCallback((placementId: string, layerType: LayerType, x: number, y: number, partId: string) => {
    const draggedPlacement = panel.layers.flatMap(l => l.placements).find(p => p.id === placementId)
    if (!draggedPlacement) return
    const oldX = draggedPlacement.x
    const oldY = draggedPlacement.y
    const snappedX = snapToGrid(x, 5.08)
    const snappedY = snapToGrid(y, 5)
    const part = parts.find(p => p.id === partId)
    if (!part) return
    const margin = partMargin(part)
    const halfW = part.dimensions.width / 2
    const halfH = part.dimensions.height / 2
    if (!placementWithinBounds(snappedX, snappedY, halfW, halfH, w, h, margin)) {
      const idsToRemove = [placementId]
      if (draggedPlacement.pairedGroupId) {
        for (const layer of panel.layers) {
          for (const pl of layer.placements) {
            if (pl.pairedGroupId === draggedPlacement.pairedGroupId && !idsToRemove.includes(pl.id)) {
              idsToRemove.push(pl.id)
            }
          }
        }
      }
      for (const id of idsToRemove) {
        for (const layer of panel.layers) {
          if (layer.placements.some(p => p.id === id)) {
            removePlacement(layer.type, id)
            break
          }
        }
      }
      return
    }
    const allPlacements = panel.layers.flatMap(l => l.placements).filter(p => p.id !== placementId)
    const newBox = getPartBoundingBox(snappedX, snappedY, halfW, halfH)
    for (const pl of allPlacements) {
      if (draggedPlacement.pairedGroupId && pl.pairedGroupId === draggedPlacement.pairedGroupId) continue
      const plPart = parts.find(p => p.id === pl.partId)
      if (!plPart) continue
      const buffer = (margin + partMargin(plPart)) / 2
      const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
      if (boxesOverlap(newBox, plBox, buffer)) return
    }
    updatePlacement(layerType, placementId, { x: snappedX, y: snappedY })

    if (draggedPlacement.pairedGroupId) {
      const dx = snappedX - oldX
      const dy = snappedY - oldY
      for (const layer of panel.layers) {
        for (const pl of layer.placements) {
          if (pl.id !== placementId && pl.pairedGroupId === draggedPlacement.pairedGroupId) {
            const newPlX = snapToGrid(pl.x + dx, 5.08)
            const newPlY = snapToGrid(pl.y + dy, 5)
            updatePlacement(layer.type, pl.id, { x: newPlX, y: newPlY })
          }
        }
      }
    }
  }, [updatePlacement, removePlacement, parts, w, h, panel.layers])

  const visibleLayerTypes = panel.layers
    .filter(l => isLayerVisible(l.type))
    .map(l => l.type)
    .sort((a, b) => {
      const order = { pcb_components: 0, panel: 1, interface: 2 }
      return (order[a] ?? 3) - (order[b] ?? 3)
    })

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        cursor: activeTool === 'place' ? 'crosshair' : 'default',
      }}
    >
      <Stage
        width={stageW}
        height={stageH}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        <Layer visible={showGrid} listening={false}>
          <PanelGrid stageW={stageW} stageH={stageH} panX={panX} panY={panY} zoom={zoom} showGrid={showGrid} gridSize={gridSize} />
        </Layer>

        {visibleLayerTypes.map((layerType) => {
          const panelOpacity = overlayMode ? 0.5 : 1
          return (
            <Layer key={layerType} visible={true} opacity={panelOpacity}>
              {layerType === 'panel' && (
                <>
                  <Rect
                    x={panX}
                    y={panY}
                    width={w * zoom}
                    height={h * zoom}
                    fill={palette('#8a8a8a', '#555')}
                    stroke={palette('#aaa', '#555')}
                    strokeWidth={1}
                    listening={false}
                  />
                  <MountingHoles
                    formatId={panel.format}
                    widthMm={w}
                    heightMm={h}
                    panX={panX}
                    panY={panY}
                    zoom={zoom}
                  />
                </>
              )}
              {layerType === 'pcb_components' && (() => {
                const pcbLayer = panel.layers.find(l => l.type === 'pcb_components')
                const fmt = getFormat(panel.format as any)
                const pcbH = pcbLayer?.height ?? fmt.pcbHeightMm
                const topRailY = fmt.railMarginTop
                const botRailY = h - fmt.railMarginBottom
                return (
                  <>
                    <Rect
                      x={panX}
                      y={panY + fmt.pcbOffsetY * zoom}
                      width={w * zoom}
                      height={pcbH * zoom}
                      fill="#2d7a2d"
                      stroke="#1a5a1a"
                      strokeWidth={0.5}
                      listening={false}
                    />
                    <Line
                      x={panX}
                      y={panY + topRailY * zoom}
                      points={[0, 0, w * zoom, 0]}
                      stroke="#ffcc00"
                      strokeWidth={1}
                      dash={[4, 4]}
                      listening={false}
                    />
                    <Line
                      x={panX}
                      y={panY + botRailY * zoom}
                      points={[0, 0, w * zoom, 0]}
                      stroke="#ffcc00"
                      strokeWidth={1}
                      dash={[4, 4]}
                      listening={false}
                    />
                  </>
                )
              })()}
              {getLayerPlacements(layerType).map((pl) => {
                const part = parts.find(p => p.id === pl.partId)
                if (!part) return null
                return (
                  <PlacementNode
                    key={pl.id}
                    placement={pl}
                    part={part}
                    panelHeight={h}
                    panX={panX}
                    panY={panY}
                    zoom={zoom}
                    selected={selectedPlacementIds.includes(pl.id)}
                    onSelect={handlePlacementSelect}
                    onDragEnd={(id, x, y, partId) => handlePlacementDragEnd(id, layerType, x, y, partId)}
                  />
                )
              })}
            </Layer>
          )
        })}

        <Layer>
          <PlacementGhost
            mousePanelPos={mousePanelPos}
            activePartId={activePartId}
            panelHeight={h}
            panX={panX}
            panY={panY}
            zoom={zoom}
            valid={isPlacementValid}
          />
        </Layer>
      </Stage>
    </div>
  )
}
