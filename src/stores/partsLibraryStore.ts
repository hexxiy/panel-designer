import { create } from 'zustand'
import type { Part, PartGroup } from '../core/types/part'
import { parseKicadMod } from '../parsers/kicad'
import { getLibraryParts } from '../core/library-parts'
import { PART_PAIRINGS } from '../core/part-pairings'
import { SAMPLE_PARTS, SAMPLE_GROUPS } from '../core/sample-parts'

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
  groups: PartGroup[]
  selectedPartId: string | null
  selectedGroupId: string | null
  searchQuery: string
  loading: boolean
  expandedGroupIds: string[]
  groupSlotOverrides: Record<string, Record<number, string>>

  loadFromDB: () => Promise<void>
  addPart: (part: Part) => Promise<void>
  updatePart: (id: string, changes: Partial<Part>) => Promise<void>
  removePart: (id: string) => Promise<void>
  importFromFile: (file: File) => Promise<Part>
  selectPart: (id: string | null) => void
  selectGroup: (id: string | null) => void
  setSearchQuery: (query: string) => void
  toggleGroupExpanded: (id: string) => void
  setSlotOverride: (groupId: string, slotIndex: number, partName: string) => void
  resolveSlotPartId: (group: PartGroup, slotIndex: number, parts: Part[]) => string | null
}

export const usePartsLibraryStore = create<PartsLibraryState>((set, get) => ({
  parts: [],
  groups: [],
  selectedPartId: null,
  selectedGroupId: null,
  searchQuery: '',
  loading: false,
  expandedGroupIds: [],
  groupSlotOverrides: {},

  loadFromDB: async () => {
    set({ loading: true })
    try {
      let parts = await getAllPartsFromDB()
      if (parts.length === 0) {
        const libraryParts = await getLibraryParts()
        for (const part of libraryParts) await putPartInDB(part)
        parts = libraryParts
      } else {
        const existingNames = new Set(parts.map(p => p.name))
        for (const sp of SAMPLE_PARTS) {
          if (!existingNames.has(sp.name)) {
            parts.push(sp)
          }
        }
        for (const part of parts) {
          const pairedName = PART_PAIRINGS[part.name]
          if (pairedName) {
            const pairedPart = parts.find(p => p.name === pairedName)
            if (pairedPart) {
              part.pairedPanelPartId = pairedPart.id
            }
          }
        }
      }
      set({ parts, groups: SAMPLE_GROUPS, loading: false })
    } catch {
      const libraryParts = await getLibraryParts()
      set({ parts: libraryParts, groups: SAMPLE_GROUPS, loading: false })
    }
  },

  addPart: async (part) => {
    await putPartInDB(part)
    set(s => ({ parts: [...s.parts, part] }))
  },

  updatePart: async (id, changes) => {
    const { parts, groups, groupSlotOverrides } = get()
    const idx = parts.findIndex(p => p.id === id)
    if (idx === -1) return
    const old = parts[idx]
    const updated: Part = { ...old, ...changes }
    await putPartInDB(updated)
    const newParts = [...parts]
    newParts[idx] = updated

    const oldName = old.name
    const newName = changes.name
    const nameChanged = newName !== undefined && newName !== oldName
    const layerChanged = changes.layerType !== undefined && changes.layerType !== old.layerType

    let newGroups = groups
    if (nameChanged || layerChanged) {
      newGroups = groups.map(g => ({
        ...g,
        slots: g.slots.map(slot => {
          if (slot.partName !== oldName) return slot
          return {
            ...slot,
            ...(nameChanged ? { partName: newName! } : {}),
            ...(layerChanged ? { layerType: changes.layerType! } : {}),
          }
        }),
      }))
    }

    let newOverrides = groupSlotOverrides
    if (nameChanged) {
      newOverrides = {}
      for (const [gid, overrides] of Object.entries(groupSlotOverrides)) {
        const mapped: Record<number, string> = {}
        for (const [idxStr, partName] of Object.entries(overrides)) {
          mapped[Number(idxStr)] = partName === oldName ? newName! : partName
        }
        newOverrides[gid] = mapped
      }
    }

    set({ parts: newParts, groups: newGroups, groupSlotOverrides: newOverrides })
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

  selectPart: (id) => set({ selectedPartId: id, selectedGroupId: null }),
  selectGroup: (id) => set({ selectedGroupId: id, selectedPartId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleGroupExpanded: (id) => set(s => ({
    expandedGroupIds: s.expandedGroupIds.includes(id)
      ? s.expandedGroupIds.filter(gid => gid !== id)
      : [...s.expandedGroupIds, id],
  })),
  setSlotOverride: (groupId, slotIndex, partName) => set(s => ({
    groupSlotOverrides: {
      ...s.groupSlotOverrides,
      [groupId]: { ...s.groupSlotOverrides[groupId], [slotIndex]: partName },
    },
  })),
  resolveSlotPartId: (group, slotIndex, parts) => {
    const { groupSlotOverrides } = get()
    const override = groupSlotOverrides[group.id]?.[slotIndex]
    const partName = override ?? group.slots[slotIndex]?.partName
    if (!partName) return null
    return parts.find(p => p.name === partName)?.id ?? null
  },
}))
