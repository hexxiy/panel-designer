import { useState, useCallback, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Line } from 'react-konva'
import { usePanelStore } from '../../stores/panelStore'
import { usePartsLibraryStore } from '../../stores/partsLibraryStore'
import { useUIStore } from '../../stores/uiStore'
import { snapToGrid } from './panelView'
import { MountingHoles } from './MountingHoles'
import { PanelGrid } from './PanelGrid'
import { PlacementNode } from './PlacementNode'
import { TextNode } from './TextNode'
import { PlacementGhost } from './PlacementGhost'
import { stageToPanel } from './panelView'
import { placementWithinBounds, getPartBoundingBox, boxesOverlap, partMargin } from '../../core/grid'
import { getFormat } from '../../core'
import type { LayerType } from '../../core/types/part'

export function PanelCanvas() {
  const panel = usePanelStore(s => s.panel)
  const addPlacement = usePanelStore(s => s.addPlacement)
  const addTextPlacement = usePanelStore(s => s.addTextPlacement)
  const updatePlacement = usePanelStore(s => s.updatePlacement)
  const removePlacement = usePanelStore(s => s.removePlacement)
  const updateTextPlacement = usePanelStore(s => s.updateTextPlacement)
  const parts = usePartsLibraryStore(s => s.parts)
  const groups = usePartsLibraryStore(s => s.groups)
  const resolveSlotPartId = usePartsLibraryStore(s => s.resolveSlotPartId)

  const activeTool = useUIStore(s => s.activeTool)
  const activePartId = useUIStore(s => s.activePartId)
  const activeGroupId = useUIStore(s => s.activeGroupId)
  const textLayer = useUIStore(s => s.textLayer)
  const textContent = useUIStore(s => s.textContent)
  const textFontSize = useUIStore(s => s.textFontSize)
  const selectedPlacementIds = useUIStore(s => s.selectedPlacementIds)
  const zoom = useUIStore(s => s.zoom)
  const panX = useUIStore(s => s.panX)
  const panY = useUIStore(s => s.panY)
  const layerVisibility = useUIStore(s => s.layerVisibility)
  const activeLayerId = useUIStore(s => s.activeLayerId)
  const overlayMode = useUIStore(s => s.overlayMode)
  const showGrid = useUIStore(s => s.showGrid)
  const gridSize = useUIStore(s => s.gridSize)
  const selectPlacement = useUIStore(s => s.selectPlacement)
  const selectPlacements = useUIStore(s => s.selectPlacements)
  const clearSelection = useUIStore(s => s.clearSelection)
  const setZoom = useUIStore(s => s.setZoom)
  const setPan = useUIStore(s => s.setPan)

  const { actualWidthMm: w, heightMm: h } = panel.dimensions

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

    if (activeTool === 'text') {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()
      if (!pointer || e.target !== stage) return

      const panelPos = stageToPanel(pointer.x, pointer.y, h, panX, panY, zoom)
      const snappedX = snapToGrid(panelPos.x, 5.08)
      const snappedY = snapToGrid(panelPos.y, 5)

      const panelLayer = panel.layers.find(l => l.type === 'panel')
      const isCopperOnAluminium = textLayer === 'copper' && panelLayer?.material === 'aluminium'
      if (isCopperOnAluminium) return

      const activeLayer = activeLayerId ? panel.layers.find(l => l.id === activeLayerId) : undefined
      const layerType = activeLayer
        ? activeLayer.type === 'interface' ? 'panel' : activeLayer.type
        : textLayer === 'silkscreen' ? 'panel' : 'pcb_components'

      const halfW = 10
      const halfH = 3
      const margin = 1
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

      addTextPlacement(layerType, textContent, snappedX, snappedY, 0, textFontSize)
      return
    }

    if (activeTool === 'place' && (activePartId || activeGroupId) && e.target === e.target.getStage()) {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()
      if (!pointer) return

      const panelPos = stageToPanel(pointer.x, pointer.y, h, panX, panY, zoom)
      const snappedX = snapToGrid(panelPos.x, 5.08)
      const snappedY = snapToGrid(panelPos.y, 5)

      if (activeGroupId) {
        const group = groups.find(g => g.id === activeGroupId)
        if (!group) return

        const margin = Math.max(1, Math.min(group.dimensions.width, group.dimensions.height) * 0.1)
        const halfW = group.dimensions.width / 2
        const halfH = group.dimensions.height / 2
        if (!placementWithinBounds(snappedX, snappedY, halfW, halfH, w, h, margin)) return

        const allPlacements = panel.layers.flatMap(l => l.placements)
        const newBox = getPartBoundingBox(snappedX, snappedY, halfW, halfH)
        let hasOverlap = false
        for (const pl of allPlacements) {
          const plPart = parts.find(p => p.id === pl.partId)
          if (!plPart) continue
          const plMargin = Math.max(1, Math.min(plPart.dimensions.width, plPart.dimensions.height) * 0.1)
          const buffer = (margin + plMargin) / 2
          const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
          if (boxesOverlap(newBox, plBox, buffer)) { hasOverlap = true; break }
        }
        if (hasOverlap) return

        const agId = crypto.randomUUID()
        for (let i = 0; i < group.slots.length; i++) {
          const slot = group.slots[i]
          const resolvedPartId = resolveSlotPartId(group, i, parts)
          if (resolvedPartId) {
            addPlacement(slot.layerType, resolvedPartId, snappedX, snappedY, 0, agId)
          }
        }
      } else if (activePartId) {
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
  }, [activeTool, activePartId, activeGroupId, h, panX, panY, zoom, w, parts, groups, resolveSlotPartId, addPlacement, panel.layers])

  const handleMouseMove = useCallback((e: any) => {
    if (isPanning.current) {
      const dx = e.evt.clientX - lastPos.current.x
      const dy = e.evt.clientY - lastPos.current.y
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      setPan(panX + dx, panY + dy)
      return
    }

    if (activeTool === 'text') {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        const panelPos = stageToPanel(pointer.x, pointer.y, h, panX, panY, zoom)
        setMousePanelPos(panelPos)

        const panelLayer = panel.layers.find(l => l.type === 'panel')
        const isCopperOnAluminium = textLayer === 'copper' && panelLayer?.material === 'aluminium'
        if (isCopperOnAluminium) { setIsPlacementValid(false); return }

        const sx = snapToGrid(panelPos.x, 5.08)
        const sy = snapToGrid(panelPos.y, 5)
        const halfW = 10
        const halfH = 3
        const margin = 1
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
      return
    }

    if (activeTool === 'place' && (activePartId || activeGroupId)) {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        const panelPos = stageToPanel(pointer.x, pointer.y, h, panX, panY, zoom)
        setMousePanelPos(panelPos)

        if (activeGroupId) {
          const group = groups.find(g => g.id === activeGroupId)
          if (group) {
            const sx = snapToGrid(panelPos.x, 5.08)
            const sy = snapToGrid(panelPos.y, 5)
            const margin = Math.max(1, Math.min(group.dimensions.width, group.dimensions.height) * 0.1)
            const halfW = group.dimensions.width / 2
            const halfH = group.dimensions.height / 2
            const inBounds = placementWithinBounds(sx, sy, halfW, halfH, w, h, margin)
            const allPlacements = panel.layers.flatMap(l => l.placements)
            const newBox = getPartBoundingBox(sx, sy, halfW, halfH)
            const noOverlap = !allPlacements.some(pl => {
              const plPart = parts.find(p => p.id === pl.partId)
              if (!plPart) return false
              const plMargin = Math.max(1, Math.min(plPart.dimensions.width, plPart.dimensions.height) * 0.1)
              const buffer = (margin + plMargin) / 2
              const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
              return boxesOverlap(newBox, plBox, buffer)
            })
            setIsPlacementValid(inBounds && noOverlap)
          }
        } else if (activePartId) {
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
    }
  }, [activeTool, activePartId, activeGroupId, h, panX, panY, zoom, setPan, w, parts, groups, panel.layers])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleStageClick = useCallback((e: any) => {
    if (activeTool === 'select' && e.target === e.target.getStage()) {
      clearSelection()
    }
  }, [activeTool, clearSelection])

  const handlePlacementSelect = useCallback((id: string) => {
    let isText = false
    for (const layer of panel.layers) {
      if (layer.texts.some(t => t.id === id)) { isText = true; break }
    }
    if (isText) { selectPlacement(id); return }

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

  const handleTextDragEnd = useCallback((textId: string, x: number, y: number) => {
    const snappedX = snapToGrid(x, 5.08)
    const snappedY = snapToGrid(y, 5)
    for (const layer of panel.layers) {
      if (layer.texts.some(t => t.id === textId)) {
        updateTextPlacement(layer.type, textId, { x: snappedX, y: snappedY })
        return
      }
    }
  }, [updateTextPlacement, panel.layers])

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
        cursor: activeTool === 'place' || activeTool === 'text' ? 'crosshair' : 'default',
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
                    fill="#6a6a6a"
                    stroke="#888"
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
              {panel.layers.find(l => l.type === layerType)?.texts.map((txt) => {
                const layer = panel.layers.find(l => l.type === layerType)
                if (!layer) return null
                return (
                  <TextNode
                    key={txt.id}
                    textPlacement={txt}
                    panelHeight={h}
                    panX={panX}
                    panY={panY}
                    zoom={zoom}
                    selected={selectedPlacementIds.includes(txt.id)}
                    layerType={layerType}
                    onSelect={handlePlacementSelect}
                    onDragEnd={(id, x, y) => handleTextDragEnd(id, x, y)}
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
            activeGroupId={activeGroupId}
            panelHeight={h}
            panX={panX}
            panY={panY}
            zoom={zoom}
            valid={isPlacementValid}
            activeTool={activeTool}
            textLayer={textLayer}
          />
        </Layer>
      </Stage>
    </div>
  )
}
