import { sexpr, type SExprChild } from './s-expr-builder'
import { getFormat } from '../../core/standards'
import { computeMountingHoles } from '../../core/panel-utils'
import type { Panel, MountingHoleOverride } from '../../core/types/panel'
import type { Part, Pad } from '../../core/types/part'

function q(s: string): string {
  return JSON.stringify(s)
}

function generateUuid(): string {
  return crypto.randomUUID()
}

interface RefDesCounters {
  J: number; R: number; SW: number; LED: number
  D: number; P: number; F: number; U: number; X: number; OTHER: number
}

function nextRefDes(category: string, counters: RefDesCounters): string {
  const map: Record<string, keyof RefDesCounters> = {
    jack: 'J', pot: 'R', switch: 'SW', led: 'LED',
    header: 'P', fuse: 'F', mounting_hole: 'X',
  }
  const key = map[category] || 'OTHER'
  return `${key}${counters[key]++}`
}

function fc(v: number): string {
  return v.toFixed(4)
}

function buildPadSExpr(pad: Pad): string {
  const drill = typeof pad.drill === 'number'
    ? sexpr('drill', pad.drill.toFixed(3))
    : sexpr('drill', sexpr('oval', pad.drill.width.toFixed(3), pad.drill.height.toFixed(3)))
  return sexpr('pad',
    q(pad.number),
    pad.type,
    pad.shape,
    sexpr('at', fc(pad.x), fc(pad.y)),
    sexpr('size', fc(pad.width), fc(pad.height)),
    drill,
    sexpr('layers', ...pad.layers.map(q)),
    sexpr('uuid', q(generateUuid())),
  )
}

function buildFootprintSExpr(refDes: string, part: Part, x: number, y: number, rotation: number): string {
  const fp = part.footprint
  const fpName = fp?.name || part.name

  const children: SExprChild[] = [
    q(fpName),
    sexpr('version', 20221018),
    sexpr('generator', q('panel-designer')),
    sexpr('layer', q('F.Cu')),
    sexpr('uuid', q(generateUuid())),
    sexpr('at', fc(x), fc(y), fc(rotation)),
    sexpr('descr', q(part.description || '')),
    sexpr('tags', q(part.category)),
    sexpr('attr', 'through_hole'),
    sexpr('property', q('Reference'), q(refDes),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.SilkS')),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1, 1), sexpr('thickness', 0.15))),
    ),
    sexpr('property', q('Value'), q(part.name),
      sexpr('at', 0, -3, 0),
      sexpr('layer', q('F.Fab')),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1, 1), sexpr('thickness', 0.15))),
    ),
    sexpr('property', q('Datasheet'), q(''),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.Fab')),
      sexpr('hide', 'yes'),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1.27, 1.27), sexpr('thickness', 0.15))),
    ),
    sexpr('property', q('Description'), q(''),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.Fab')),
      sexpr('hide', 'yes'),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1.27, 1.27), sexpr('thickness', 0.15))),
    ),
  ]

  if (fp?.pads) {
    for (const pad of fp.pads) children.push(buildPadSExpr(pad))
  }

  if (fp?.models) {
    for (const modelPath of fp.models) {
      children.push(sexpr('model', q(modelPath),
        sexpr('offset', sexpr('xyz', '0', '0', '0')),
        sexpr('scale', sexpr('xyz', '1', '1', '1')),
        sexpr('rotate', sexpr('xyz', '0', '0', '0')),
      ))
    }
  }

  return sexpr('footprint', ...children)
}

function buildInterfaceSExpr(pl: { placement: import('../../core/types/panel').Placement; part: Part }, refDes: string): string {
  return sexpr('footprint', q(pl.part.name),
    sexpr('version', 20221018),
    sexpr('generator', q('panel-designer')),
    sexpr('layer', q('F.SilkS')),
    sexpr('uuid', q(generateUuid())),
    sexpr('attr', 'virtual'),
    sexpr('at', fc(pl.placement.x), fc(pl.placement.y), fc(pl.placement.rotation)),
    sexpr('property', q('Reference'), q(refDes),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.SilkS')),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1, 1), sexpr('thickness', 0.15))),
    ),
    sexpr('property', q('Value'), q(pl.part.name),
      sexpr('at', 0, -3, 0),
      sexpr('layer', q('F.SilkS')),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1, 1), sexpr('thickness', 0.15))),
    ),
    sexpr('property', q('Datasheet'), q(''),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.Fab')),
      sexpr('hide', 'yes'),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1.27, 1.27), sexpr('thickness', 0.15))),
    ),
    sexpr('property', q('Description'), q(''),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.Fab')),
      sexpr('hide', 'yes'),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', 1.27, 1.27), sexpr('thickness', 0.15))),
    ),
  )
}

function buildHeaderLines(): string[] {
  return [
    '(kicad_pcb',
    '  (version 20241229)',
    `  (generator ${q('panel-designer')})`,
    '  (generator_version "0.2")',
    '',
    '  (general',
    '    (thickness 1.6)',
    '    (legacy_teardrops no)',
    '  )',
    '',
    '  (paper "A4")',
    '',
    '  (layers',
    '    (0 "F.Cu" signal)',
    '    (2 "B.Cu" signal)',
    '    (9 "F.Adhes" user "F.Adhesive")',
    '    (11 "B.Adhes" user "B.Adhesive")',
    '    (13 "F.Paste" user)',
    '    (15 "B.Paste" user)',
    '    (5 "F.SilkS" user "F.Silkscreen")',
    '    (7 "B.SilkS" user "B.Silkscreen")',
    '    (1 "F.Mask" user)',
    '    (3 "B.Mask" user)',
    '    (17 "Dwgs.User" user "User.Drawings")',
    '    (19 "Cmts.User" user "User.Comments")',
    '    (21 "Eco1.User" user "User.Eco1")',
    '    (23 "Eco2.User" user "User.Eco2")',
    '    (25 "Edge.Cuts" user)',
    '    (27 "Margin" user)',
    '    (31 "F.CrtYd" user "F.Courtyard")',
    '    (29 "B.CrtYd" user "B.Courtyard")',
    '    (35 "F.Fab" user)',
    '    (33 "B.Fab" user)',
    '  )',
    '',
    '  (setup',
    '    (stackup',
    '      (layer "F.SilkS" (type "Top Silk Screen"))',
    '      (layer "F.Paste" (type "Top Solder Paste"))',
    '      (layer "F.Mask" (type "Top Solder Mask") (color "Green") (thickness 0.01))',
    '      (layer "F.Cu" (type copper) (thickness 0.035))',
    '      (layer "dielectric 1" (type core) (thickness 1.51) (material "FR4") (epsilon_r 4.5) (loss_tangent 0.02))',
    '      (layer "B.Cu" (type copper) (thickness 0.035))',
    '      (layer "B.Mask" (type "Bottom Solder Mask") (color "Green") (thickness 0.01))',
    '      (layer "B.Paste" (type "Bottom Solder Paste"))',
    '      (layer "B.SilkS" (type "Bottom Silk Screen"))',
    '      (copper_finish "None")',
    '      (dielectric_constraints no)',
    '    )',
    '    (pad_to_mask_clearance 0)',
    '    (allow_soldermask_bridges_in_footprints no)',
    '    (tenting front back)',
    '    (pcbplotparams',
    '      (layerselection 0x00000000_00000000_55555555_5755f5ff)',
    '      (plot_on_all_layers_selection 0x00000000_00000000_00000000_00000000)',
    '      (disableapertmacros no)',
    '      (usegerberextensions yes)',
    '      (usegerberattributes yes)',
    '      (usegerberadvancedattributes yes)',
    '      (creategerberjobfile yes)',
    '      (dashed_line_dash_ratio 12.000000)',
    '      (dashed_line_gap_ratio 3.000000)',
    '      (svgprecision 4)',
    '      (plotframeref no)',
    '      (mode 1)',
    '      (useauxorigin no)',
    '      (hpglpennumber 1)',
    '      (hpglpenspeed 20)',
    '      (hpglpendiameter 15.000000)',
    '      (pdf_front_fp_property_popups yes)',
    '      (pdf_back_fp_property_popups yes)',
    '      (pdf_metadata yes)',
    '      (pdf_single_document no)',
    '      (dxfpolygonmode yes)',
    '      (dxfimperialunits yes)',
    '      (dxfusepcbnewfont yes)',
    '      (psnegative no)',
    '      (psa4output no)',
    '      (plot_black_and_white yes)',
    '      (sketchpadsonfab no)',
    '      (plotpadnumbers no)',
    '      (hidednponfab no)',
    '      (sketchdnponfab yes)',
    '      (crossoutdnponfab yes)',
    '      (subtractmaskfromsilk yes)',
    '      (outputformat 1)',
    '      (mirror no)',
    '      (drillshape 0)',
    '      (scaleselection 1)',
    '      (outputdirectory "")',
    '    )',
    '  )',
    '',
    '  (net 0 "")',
    '',
  ]
}

function buildOutlineLines(w: number, h: number): string[] {
  return [sexpr('gr_rect',
    sexpr('start', 0, 0),
    sexpr('end', fc(w), fc(h)),
    sexpr('stroke', sexpr('width', '0.05'), sexpr('type', 'default')),
    sexpr('fill', 'no'),
    sexpr('layer', q('Edge.Cuts')),
    sexpr('uuid', q(generateUuid())),
  )]
}

function buildMountingHoleSExpr(x: number, y: number, drillDiameter: number, ringDiameter: number): string {
  const fpUuid = generateUuid()
  const padUuid = generateUuid()

  function fpProp(name: string, value: string, ax: number, ay: number, layer: string, fontSize?: [number, number]): string {
    return sexpr('property', q(name), q(value),
      sexpr('at', ax, ay, 0),
      sexpr('layer', q(layer)),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', fontSize?.[0] ?? 1, fontSize?.[1] ?? 1), sexpr('thickness', 0.15))),
    )
  }

  function fpPropHidden(name: string, value: string, fontSize?: [number, number]): string {
    return sexpr('property', q(name), q(value),
      sexpr('at', 0, 0, 0),
      sexpr('layer', q('F.Fab')),
      sexpr('hide', 'yes'),
      sexpr('uuid', q(generateUuid())),
      sexpr('effects', sexpr('font', sexpr('size', fontSize?.[0] ?? 1.27, fontSize?.[1] ?? 1.27), sexpr('thickness', 0.15))),
    )
  }

  return sexpr('footprint', q('Eurocad:mounting_hole'),
    sexpr('layer', q('F.Cu')),
    sexpr('uuid', q(fpUuid)),
    sexpr('at', fc(x), fc(y)),
    fpProp('Reference', 'REF**', 0, 0.5, 'F.SilkS', [1, 1]),
    fpProp('Value', 'mounting_hole', 0, -0.5, 'F.Fab', [1, 1]),
    fpPropHidden('Datasheet', ''),
    fpPropHidden('Description', ''),
    sexpr('attr', 'through_hole'),
    sexpr('pad', q('1'), 'thru_hole', 'circle',
      sexpr('at', 0, 0),
      sexpr('size', fc(ringDiameter), fc(ringDiameter)),
      sexpr('drill', fc(drillDiameter)),
      sexpr('layers', q('*.Cu'), q('*.Mask')),
      sexpr('remove_unused_layers', 'no'),
      sexpr('uuid', q(padUuid)),
    ),
    sexpr('embedded_fonts', 'no'),
  )
}

function buildMountingHoleLines(w: number, h: number, panelFormat: import('../../core/types/format').PanelFormat, overrides?: Record<number, MountingHoleOverride>): string[] {
  const lines: string[] = []
  const holes = computeMountingHoles(w, h, panelFormat, overrides)
  for (const hole of holes) {
    lines.push(buildMountingHoleSExpr(hole.x, hole.y, hole.diameter, hole.ringDiameter))
  }
  return lines
}

function buildPanelFootprintSExpr(part: Part, x: number, y: number, rotation: number): string {
  const fp = part.footprint
  const fpName = `Eurocad:${fp?.name || part.name}`
  const children: SExprChild[] = [
    q(fpName),
    sexpr('version', 20221018),
    sexpr('generator', q('panel-designer')),
    sexpr('layer', q('F.Cu')),
    sexpr('uuid', q(generateUuid())),
    sexpr('at', fc(x), fc(y), fc(rotation)),
    sexpr('attr', 'board_only'),
  ]
  if (fp?.pads) {
    for (const pad of fp.pads) children.push(buildPadSExpr(pad))
  }
  return sexpr('footprint', ...children)
}

function buildCutoutLines(panelLayer: LayerGroup['panel']): string[] {
  const lines: string[] = []
  if (panelLayer.length > 0) {
    lines.push('')
    for (const pl of panelLayer) {
      if (pl.part.footprint && pl.part.footprint.pads.length > 0) {
        lines.push(buildPanelFootprintSExpr(pl.part, pl.placement.x, pl.placement.y, pl.placement.rotation))
      }
    }
  }
  return lines
}

function buildCopperZoneLines(w: number, h: number): string[] {
  const d = 0.5
  return [sexpr('zone',
    sexpr('net', 0),
    sexpr('net_name', q('')),
    sexpr('layers', q('F.Cu'), q('B.Cu')),
    sexpr('uuid', q(generateUuid())),
    sexpr('hatch', 'edge', 0.5),
    sexpr('connect_pads', sexpr('clearance', 0.5)),
    sexpr('min_thickness', 0.25),
    sexpr('filled_areas_thickness', 'no'),
    sexpr('fill', 'yes',
      sexpr('thermal_gap', 0.5),
      sexpr('thermal_bridge_width', 0.5),
      sexpr('island_removal_mode', 1),
      sexpr('island_area_min', 10),
    ),
    sexpr('polygon',
      sexpr('pts',
        sexpr('xy', 0, 0),
        sexpr('xy', fc(w), 0),
        sexpr('xy', fc(w), fc(h)),
        sexpr('xy', 0, fc(h)),
      ),
    ),
    sexpr('filled_polygon',
      sexpr('layer', q('F.Cu')),
      sexpr('island'),
      sexpr('pts',
        sexpr('xy', fc(d), fc(d)),
        sexpr('xy', fc(w - d), fc(d)),
        sexpr('xy', fc(w - d), fc(h - d)),
        sexpr('xy', fc(d), fc(h - d)),
      ),
    ),
    sexpr('filled_polygon',
      sexpr('layer', q('B.Cu')),
      sexpr('island'),
      sexpr('pts',
        sexpr('xy', fc(d), fc(d)),
        sexpr('xy', fc(w - d), fc(d)),
        sexpr('xy', fc(w - d), fc(h - d)),
        sexpr('xy', fc(d), fc(h - d)),
      ),
    ),
  )]
}

export function exportKicadPcb(panel: Panel, parts: Part[]): string {
  const panelFormat = getFormat(panel.format)
  const { actualWidthMm: w, heightMm: h } = panel.dimensions
  const counters: RefDesCounters = { J: 1, R: 1, SW: 1, LED: 1, D: 1, P: 1, F: 1, U: 1, X: 1, OTHER: 1 }
  const lines: string[] = buildHeaderLines()

  const { pcb_components, interface: iface, panel: panelLayer } = groupPlacementsByLayer(panel, parts)

  lines.push(...buildOutlineLines(w, h))

  lines.push('')
  lines.push(...buildMountingHoleLines(w, h, panelFormat, panel.mountingHoleOverrides))
  lines.push(...buildCutoutLines(panelLayer))

  if (pcb_components.length > 0) {
    lines.push('')
    for (const pl of pcb_components) {
      const refDes = nextRefDes(pl.part.category, counters)
      lines.push(buildFootprintSExpr(refDes, pl.part, pl.placement.x, pl.placement.y, pl.placement.rotation))
    }
  }

  if (iface.length > 0) {
    lines.push('')
    for (const pl of iface) {
      const refDes = nextRefDes(pl.part.category, counters)
      lines.push(buildInterfaceSExpr(pl, refDes))
    }
  }

  lines.push('')
  lines.push(...buildCopperZoneLines(w, h))

  lines.push('  (embedded_fonts no)')
  lines.push(')')
  return lines.join('\n') + '\n'
}

export function exportKicadPcbPanelOnly(panel: Panel, parts: Part[]): string {
  const panelFormat = getFormat(panel.format)
  const { actualWidthMm: w, heightMm: h } = panel.dimensions
  const counters: RefDesCounters = { J: 1, R: 1, SW: 1, LED: 1, D: 1, P: 1, F: 1, U: 1, X: 1, OTHER: 1 }
  const lines: string[] = buildHeaderLines()

  const { interface: iface, panel: panelLayer } = groupPlacementsByLayer(panel, parts)

  lines.push(...buildOutlineLines(w, h))

  lines.push('')
  lines.push(...buildMountingHoleLines(w, h, panelFormat, panel.mountingHoleOverrides))
  lines.push(...buildCutoutLines(panelLayer))

  if (iface.length > 0) {
    lines.push('')
    for (const pl of iface) {
      const refDes = nextRefDes(pl.part.category, counters)
      lines.push(buildInterfaceSExpr(pl, refDes))
    }
  }

  lines.push('  (embedded_fonts no)')
  lines.push(')')
  return lines.join('\n') + '\n'
}

export function exportKicadPcbComponentsOnly(panel: Panel, parts: Part[]): string {
  const counters: RefDesCounters = { J: 1, R: 1, SW: 1, LED: 1, D: 1, P: 1, F: 1, U: 1, X: 1, OTHER: 1 }
  const lines: string[] = buildHeaderLines()

  const { pcb_components } = groupPlacementsByLayer(panel, parts)

  const pcbLayer = panel.layers.find(l => l.type === 'pcb_components')
  const pcbH = pcbLayer?.height ?? getFormat(panel.format).pcbHeightMm

  lines.push(...buildOutlineLines(panel.dimensions.actualWidthMm, pcbH))

  if (pcb_components.length > 0) {
    lines.push('')
    for (const pl of pcb_components) {
      const refDes = nextRefDes(pl.part.category, counters)
      lines.push(buildFootprintSExpr(refDes, pl.part, pl.placement.x, pl.placement.y, pl.placement.rotation))
    }
  }

  lines.push('')
  lines.push(...buildCopperZoneLines(panel.dimensions.actualWidthMm, pcbH))

  lines.push('  (embedded_fonts no)')
  lines.push(')')
  return lines.join('\n') + '\n'
}

interface LayerGroup {
  pcb_components: { placement: import('../../core/types/panel').Placement; part: Part }[]
  interface: { placement: import('../../core/types/panel').Placement; part: Part }[]
  panel: { placement: import('../../core/types/panel').Placement; part: Part }[]
}

function groupPlacementsByLayer(panel: Panel, parts: Part[]): LayerGroup {
  const groups: LayerGroup = { pcb_components: [], interface: [], panel: [] }
  for (const layer of panel.layers) {
    for (const placement of layer.placements) {
      const part = parts.find(p => p.id === placement.partId)
      if (!part) continue
      if (layer.type === 'pcb_components') groups.pcb_components.push({ placement, part })
      else if (layer.type === 'interface') groups.interface.push({ placement, part })
      else if (layer.type === 'panel') groups.panel.push({ placement, part })
    }
  }
  return groups
}
