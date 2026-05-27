import type { Part } from './types/part'

export const SAMPLE_PARTS: Part[] = [
  {
    id: crypto.randomUUID(),
    name: 'Alpha9mmPot',
    category: 'pot',
    layerType: 'pcb_components',
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
    },
    dimensions: { width: 9.5, height: 12, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'PJ301M-12',
    category: 'jack',
    layerType: 'pcb_components',
    footprint: {
      name: 'PJ301M-12',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: 0, y: 6.48, width: 1.8, height: 1.8, drill: 1.02, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 0, y: 3.38, width: 1.8, height: 1.8, drill: 1.02, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '3', type: 'thru_hole', shape: 'circle', x: 0, y: -4.92, width: 1.8, height: 1.8, drill: 1.02, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
      ],
      models: ['PJ301M-12 Thonkiconn v0.2.stp'],
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
    },
    dimensions: { width: 5, height: 5, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'TL1105SPF250Q',
    category: 'switch',
    layerType: 'pcb_components',
    footprint: {
      name: 'TL1105SPF250Q',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: -3.25, y: 2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 3.25, y: 2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '3', type: 'thru_hole', shape: 'circle', x: -3.25, y: -2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
        { number: '4', type: 'thru_hole', shape: 'circle', x: 3.25, y: -2.25, width: 1.524, height: 1.524, drill: 1, layers: ['*.Cu', '*.Mask', 'F.SilkS'] },
      ],
      models: [],
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
    },
    dimensions: { width: 4, height: 4, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'Davies1900',
    category: 'other',
    layerType: 'interface',
    couplingGroup: 'Davies1900',
    footprint: {
      name: 'Davies1900',
      pads: [],
      models: ['davies_1900.step'],
    },
    dimensions: { width: 19, height: 15, depth: 0 },
  },
  {
    id: crypto.randomUUID(),
    name: 'DC_JACK',
    category: 'other',
    layerType: 'pcb_components',
    footprint: {
      name: 'DC_JACK',
      pads: [
        { number: '1', type: 'thru_hole', shape: 'circle', x: 0, y: 0, width: 4, height: 4, drill: 3.5, layers: ['*.Cu', '*.Mask'] },
        { number: '2', type: 'thru_hole', shape: 'circle', x: 0, y: 6, width: 3.5, height: 3.5, drill: 3, layers: ['*.Cu', '*.Mask'] },
        { number: '3', type: 'thru_hole', shape: 'circle', x: 4.7, y: 3, width: 3.5, height: 3.5, drill: 3, layers: ['*.Cu', '*.Mask'] },
      ],
      models: [],
    },
    dimensions: { width: 9, height: 16, depth: 0 },
  },
]
