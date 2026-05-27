import { useState, useCallback, useRef, useEffect } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
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
import { placementWithinBounds, getPartBoundingBox, boxesOverlap } from '../../core/grid'
import type { LayerType } from '../../core/types/part'

export function PanelCanvas() {
  const panel = usePanelStore(s => s.panel)
  const addPlacement = usePanelStore(s => s.addPlacement)
  const updatePlacement = usePanelStore(s => s.updatePlacement)
  const parts = usePartsLibraryStore(s => s.parts)
  const themeId = useThemeStore(s => s.themeId)

  const activeTool = useUIStore(s => s.activeTool)
  const activePartId = useUIStore(s => s.activePartId)
  const selectedPlacementIds = useUIStore(s => s.selectedPlacementIds)
  const zoom = useUIStore(s => s.zoom)
  const panX = useUIStore(s => s.panX)
  const panY = useUIStore(s => s.panY)
  const layerVisibility = useUIStore(s => s.layerVisibility)
  const activeLayerId = useUIStore(s => s.activeLayerId)
  const overlayMode = useUIStore(s => s.overlayMode)
  const selectPlacement = useUIStore(s => s.selectPlacement)
  const clearSelection = useUIStore(s => s.clearSelection)
  const setZoom = useUIStore(s => s.setZoom)
  const setPan = useUIStore(s => s.setPan)

  const { actualWidthMm: w, heightMm: h } = panel.dimensions

  const [mousePanelPos, setMousePanelPos] = useState<{ x: number; y: number } | null>(null)
  const [isPlacementValid, setIsPlacementValid] = useState(true)
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const palette = useCallback((light: string, dark: string) => themeId === 'light' ? light : dark, [themeId])

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
    const clamped = Math.max(0.5, Math.min(5, newScale))

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

      const halfW = part.dimensions.width / 2
      const halfH = part.dimensions.height / 2
      if (!placementWithinBounds(snappedX, snappedY, halfW, halfH, w, h)) return

      const allPlacements = panel.layers.flatMap(l => l.placements)
      const newBox = getPartBoundingBox(snappedX, snappedY, halfW, halfH)
      for (const pl of allPlacements) {
        const plPart = parts.find(p => p.id === pl.partId)
        if (!plPart) continue
        const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
        if (boxesOverlap(newBox, plBox)) return
      }

      const targetLayerType = activeLayerId
        ? (panel.layers.find(l => l.id === activeLayerId)?.type ?? part.layerType)
        : part.layerType
      addPlacement(targetLayerType, part.id, snappedX, snappedY)

      if (part.couplingGroup) {
        for (const other of parts) {
          if (other.id !== part.id && other.couplingGroup === part.couplingGroup) {
            addPlacement(other.layerType, other.id, snappedX, snappedY)
          }
        }
      }

      if (part.panelCutout && part.layerType !== 'panel') {
        addPlacement('panel', part.id + '_cutout', snappedX, snappedY)
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
          const halfW = part.dimensions.width / 2
          const halfH = part.dimensions.height / 2
          const inBounds = placementWithinBounds(sx, sy, halfW, halfH, w, h)
          const allPlacements = panel.layers.flatMap(l => l.placements)
          const newBox = getPartBoundingBox(sx, sy, halfW, halfH)
          const noOverlap = !allPlacements.some(pl => {
            const plPart = parts.find(p => p.id === pl.partId)
            if (!plPart) return false
            const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
            return boxesOverlap(newBox, plBox)
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
    selectPlacement(id)
  }, [selectPlacement])

  const handlePlacementDragEnd = useCallback((placementId: string, layerType: LayerType, x: number, y: number, partId: string) => {
    const snappedX = snapToGrid(x, 5.08)
    const snappedY = snapToGrid(y, 5)
    const part = parts.find(p => p.id === partId)
    if (!part) return
    const halfW = part.dimensions.width / 2
    const halfH = part.dimensions.height / 2
    if (!placementWithinBounds(snappedX, snappedY, halfW, halfH, w, h)) return
    const allPlacements = panel.layers.flatMap(l => l.placements).filter(p => p.id !== placementId)
    const newBox = getPartBoundingBox(snappedX, snappedY, halfW, halfH)
    for (const pl of allPlacements) {
      const plPart = parts.find(p => p.id === pl.partId)
      if (!plPart) continue
      const plBox = getPartBoundingBox(pl.x, pl.y, plPart.dimensions.width / 2, plPart.dimensions.height / 2)
      if (boxesOverlap(newBox, plBox)) return
    }
    updatePlacement(layerType, placementId, { x: snappedX, y: snappedY })
  }, [updatePlacement, parts, w, h, panel.layers])

  const panelColor = palette('#f0f0f0', '#222')

  const visibleLayerTypes = (['pcb_components', 'panel', 'interface'] as const)
    .filter(lt => isLayerVisible(lt))

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
        <Layer>
          <PanelGrid widthMm={w} heightMm={h} panX={panX} panY={panY} zoom={zoom} />

          <Rect
            x={panX}
            y={panY}
            width={w * zoom}
            height={h * zoom}
            fill={panelColor}
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
        </Layer>

        {visibleLayerTypes.map((layerType) => {
          const panelOpacity = (overlayMode && layerType === 'panel') ? 0.25 : 1
          return (
            <Layer key={layerType} visible={true} opacity={panelOpacity}>
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
