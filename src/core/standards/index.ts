import type { PanelFormatId, PanelFormat } from '../types/format'
import { eurorack } from './eurorack'
import { fourU } from './fourU'
import { buchla } from './buchla'

const STANDARDS: Record<PanelFormatId, PanelFormat> = {
  eurorack,
  '4u': fourU,
  buchla,
}

export function getFormat(id: PanelFormatId): PanelFormat {
  return STANDARDS[id]
}

export function getFormatIds(): PanelFormatId[] {
  return Object.keys(STANDARDS) as PanelFormatId[]
}

export { eurorack, fourU, buchla }
