import type { Panel } from '../core/types/panel'

const DB_NAME = 'panel-designer'
const PANEL_STORE = 'panels'
const DB_VERSION = 2

export interface SavedPanelDoc {
  version: number
  savedAt: string
  panel: Panel
}

export interface PanelRecord {
  id: string
  name: string
  author: string
  format: string
  hp: number
  modified: string
  doc: SavedPanelDoc
}

function isPanel(v: unknown): v is Panel {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return typeof p.id === 'string' && typeof p.format === 'string' && typeof p.dimensions === 'object'
}

export function serializePanel(panel: Panel): string {
  return JSON.stringify({ version: 1, savedAt: new Date().toISOString(), panel }, null, 2)
}

export function deserializePanel(json: string): Panel {
  const parsed = JSON.parse(json)
  if (parsed && typeof parsed === 'object' && 'version' in parsed) {
    const doc = parsed as SavedPanelDoc
    if (isPanel(doc.panel)) return doc.panel
  }
  if (isPanel(parsed)) return parsed as Panel
  throw new Error('Invalid panel JSON')
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(PANEL_STORE)) {
        req.result.createObjectStore(PANEL_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function panelToRecord(panel: Panel): PanelRecord {
  return {
    id: panel.id,
    name: panel.metadata.name,
    author: panel.metadata.author ?? '',
    format: panel.format,
    hp: panel.dimensions.hp,
    modified: panel.metadata.modified,
    doc: { version: 1, savedAt: new Date().toISOString(), panel },
  }
}

export async function savePanel(panel: Panel): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PANEL_STORE, 'readwrite')
    const store = tx.objectStore(PANEL_STORE)
    store.put(panelToRecord(panel))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadPanel(id: string): Promise<PanelRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PANEL_STORE, 'readonly')
    const store = tx.objectStore(PANEL_STORE)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result ?? undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function deletePanel(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PANEL_STORE, 'readwrite')
    const store = tx.objectStore(PANEL_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listPanels(): Promise<PanelRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PANEL_STORE, 'readonly')
    const store = tx.objectStore(PANEL_STORE)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function downloadPanelJson(panel: Panel): void {
  const json = serializePanel(panel)
  const name = panel.metadata.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'panel'
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importPanelFromFile(file: File): Promise<Panel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const panel = deserializePanel(reader.result as string)
        resolve(panel)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
