import { create } from 'zustand'
import type { Part } from '../core/types/part'
import { parseKicadMod } from '../parsers/kicad'
import { SAMPLE_PARTS } from '../core/sample-parts'

const DB_NAME = 'panel-designer'
const STORE_NAME = 'parts'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllPartsFromDB(): Promise<Part[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function putPartInDB(part: Part): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(part)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function deletePartFromDB(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

interface PartsLibraryState {
  parts: Part[]
  selectedPartId: string | null
  searchQuery: string
  loading: boolean

  loadFromDB: () => Promise<void>
  addPart: (part: Part) => Promise<void>
  removePart: (id: string) => Promise<void>
  importFromFile: (file: File) => Promise<Part>
  selectPart: (id: string | null) => void
  setSearchQuery: (query: string) => void
}

export const usePartsLibraryStore = create<PartsLibraryState>((set) => ({
  parts: [],
  selectedPartId: null,
  searchQuery: '',
  loading: false,

  loadFromDB: async () => {
    set({ loading: true })
    try {
      let parts = await getAllPartsFromDB()
      if (parts.length === 0) {
        for (const part of SAMPLE_PARTS) await putPartInDB(part)
        parts = SAMPLE_PARTS
      }
      set({ parts, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addPart: async (part) => {
    await putPartInDB(part)
    set(s => ({ parts: [...s.parts, part] }))
  },

  removePart: async (id) => {
    await deletePartFromDB(id)
    set(s => ({
      parts: s.parts.filter(p => p.id !== id),
      selectedPartId: s.selectedPartId === id ? null : s.selectedPartId,
    }))
  },

  importFromFile: async (file) => {
    const text = await file.text()
    const part = await parseKicadMod(text, file.name)
    await putPartInDB(part)
    set(s => ({ parts: [...s.parts, part] }))
    return part
  },

  selectPart: (id) => set({ selectedPartId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
