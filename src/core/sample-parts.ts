import type { Part } from './types/part'

const potHole7_5mm: Part = {
  id: crypto.randomUUID(),
  name: 'pot_hole_7.5mm',
  category: 'mounting_hole',
  layerType: 'panel',
  panelCutout: { type: 'circle', width: 7.5, height: 7.5, x: 0, y: 0 },
  footprint: {
    name: 'pot_hole_7.5mm',
    pads: [
      { number: '1', type: 'npth', shape: 'circle', x: 0, y: 0, width: 10, height: 10, drill: 7.5, layers: ['*.Cu', '*.Mask'] },
    ],
    models: [],
    graphics: [],
  },
  dimensions: { width: 10, height: 10, depth: 0 },
}

const jackPot: Part = {
  id: crypto.randomUUID(),
  name: 'jack_pot',
  category: 'mounting_hole',
  layerType: 'panel',
  panelCutout: { type: 'circle', width: 6.5, height: 6.5, x: 0, y: 0 },
  footprint: {
    name: 'jack_pot',
    pads: [
      { number: '', type: 'npth', shape: 'circle', x: 0, y: 0, width: 8.5, height: 8.5, drill: 6.5, layers: ['*.Cu', '*.Mask'] },
    ],
    models: [],
    graphics: [],
  },
  dimensions: { width: 8.5, height: 8.5, depth: 0 },
}

const jackPotOut: Part = {
  id: crypto.randomUUID(),
  name: 'jack_pot_out',
  category: 'mounting_hole',
  layerType: 'panel',
  panelCutout: { type: 'circle', width: 6.5, height: 6.5, x: 0, y: 0 },
  footprint: {
    name: 'jack_pot_out',
    pads: [
      { number: '1', type: 'npth', shape: 'roundrect', x: 0, y: 0, width: 9, height: 9, drill: 6.5, layers: ['*.Cu', '*.Mask'] },
    ],
    models: [],
    graphics: [],
  },
  dimensions: { width: 9, height: 9, depth: 0 },
}

const switchMount: Part = {
  id: crypto.randomUUID(),
  name: 'switch_mount',
  category: 'mounting_hole',
  layerType: 'panel',
  panelCutout: { type: 'circle', width: 0.762, height: 0.762, x: 0, y: 0 },
  footprint: {
    name: 'switch_mount',
    pads: [
      { number: '1', type: 'npth', shape: 'circle', x: 0, y: 0, width: 1.524, height: 1.524, drill: 0.762, layers: ['*.Cu', '*.Mask'] },
    ],
    models: [],
    graphics: [],
  },
  dimensions: { width: 1.524, height: 1.524, depth: 0 },
}

export const SAMPLE_PARTS: Part[] = [
  potHole7_5mm,
  jackPot,
  jackPotOut,
  switchMount,
  {
    id: crypto.randomUUID(),
    name: 'Alpha9mmPot',
    category: 'pot',
    layerType: 'pcb_components',
    pairedPanelPartId: potHole7_5mm.id,
    footprint: {
      name: 'Alpha9mmPot',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'rect', x: -2.5, y: 7.5, width: 1.7, height: 1.7, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '2', type: 'thru_hole', shape: 'rect', x: 0, y: 7.5, width: 1.7, height: 1.7, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '3', type: 'thru_hole', shape: 'rect', x: 2.5, y: 7.5, width: 1.7, height: 1.7, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '', type: 'thru_hole', shape: 'circle', x: -4.8, y: 0, width: 2.5, height: 2.5, drill: 1.8, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '', type: 'thru_hole', shape: 'circle', x: 4.8, y: 0, width: 2.5, height: 2.5, drill: 1.8, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
      ],
      models: ['ALPHA-RD901F-40.step'],
      graphics: [],
    },
    dimensions: { width: 9.5, height: 12, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'PJ301M-12',
    category: 'jack',
    layerType: 'pcb_components',
    pairedPanelPartId: jackPot.id,
    footprint: {
      name: 'PJ301M-12',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: 0, y: 6.48, width: 1.8, height: 1.8, drill: 1.02, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 0, y: 3.38, width: 1.8, height: 1.8, drill: 1.02, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '3', type: 'thru_hole', shape: 'circle', x: 0, y: -4.92, width: 1.8, height: 1.8, drill: 1.02, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
      ],
      models: ['PJ301M-12 Thonkiconn v0.2.stp'],
      graphics: [],
    },
    dimensions: { width: 9, height: 11.4, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'LED3mm',
    category: 'led',
    layerType: 'pcb_components',
    footprint: {
      name: 'LED3mm',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'rect', x: -1.27, y: 0, width: 2, height: 2, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 1.27, y: 0, width: 2, height: 2, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
      ],
      models: ['LED-3MM.wrl'],
      graphics: [],
    },
    dimensions: { width: 5, height: 5, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'TL1105SPF250Q',
    category: 'switch',
    layerType: 'pcb_components',
    pairedPanelPartId: switchMount.id,
    footprint: {
      name: 'TL1105SPF250Q',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: -3.25, y: 2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 3.25, y: 2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '3', type: 'thru_hole', shape: 'circle', x: -3.25, y: -2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '4', type: 'thru_hole', shape: 'circle', x: 3.25, y: -2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
      ],
      models: [],
      graphics: [],
    },
    dimensions: { width: 8.3, height: 6.3, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'mounting_hole',
    category: 'mounting_hole',
    layerType: 'panel',
    panelCutout: { type: 'circle', width: 3.2, height: 3.2, x: 0, y: 0 },
    footprint: {
      name: 'mounting_hole',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: 0, y: 0, width: 4, height: 4, drill: 3.2, layers: ['*.Cu', '*.Mask'] },
      ],
      models: [],
      graphics: [],
    },
    dimensions: { width: 4, height: 4, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'Davies1900',
    category: 'other',
    layerType: 'interface',
    footprint: {
      name: 'Davies1900',
      pads: [],
      models: ['davies_1900.step'],
      graphics: [
        { type: 'circle', cx: 0, cy: 0, radius: 6.5, width: 0.3 },
        { type: 'line', x1: 0, y1: 0, x2: 0, y2: 4.5, width: 0.5 },
      ],
    },
    dimensions: { width: 13, height: 13, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'KnobAssembly',
    category: 'other',
    layerType: 'pcb_components',
    footprint: {
      name: 'KnobAssembly',
      pads: [],
      models: [],
      graphics: [
        { type: 'circle', cx: 0, cy: 0, radius: 6.5, width: 0.3 },
        { type: 'line', x1: 0, y1: 0, x2: 0, y2: 4.5, width: 0.5 },
        { type: 'circle', cx: 0, cy: 0, radius: 3.25, width: 0.2 },
      ],
    },
    dimensions: { width: 13, height: 13, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'DC_JACK',
    category: 'other',
    layerType: 'pcb_components',
    pairedPanelPartId: jackPotOut.id,
    footprint: {
      name: 'DC_JACK',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: 0, y: 0, width: 4, height: 4, drill: 3.5, layers: ['*.Cu', '*.Mask'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 0, y: 6, width: 3.5, height: 3.5, drill: 3, layers: ['*.Cu', '*.Mask'] },
        { number: '3', type: 'thru_hole', shape: 'circle', x: 4.7, y: 3, width: 3.5, height: 3.5, drill: 3, layers: ['*.Cu', '*.Mask'] },
      ],
      models: [],
      graphics: [],
    },
    dimensions: { width: 9, height: 16, depth: 0 },
  },
]
