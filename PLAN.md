# Panel Designer — Development Plan

## Phase 0 — Foundation

### 0.1 — Undo/Redo ✅
Custom undo/redo stack in `panelStore.ts` using `undoStack`/`redoStack` arrays with `MAX_HISTORY = 50`.
All mutating actions (`setFormat`, `setHp`, `addPlacement`, `removePlacement`, `updatePlacement`)
push the previous state onto the stack before applying changes. `clearHistory()` resets both stacks.

### 0.2 — Undo/Redo Keyboard Shortcuts + Toolbar Buttons ✅
- `Ctrl+Z` → undo, `Ctrl+Shift+Z` / `Ctrl+Y` → redo
- Toolbar buttons (↶ / ↷) with disabled state when stack is empty
- Handled in `Toolbar.tsx` via `useEffect` global keydown listener

### 0.3 — Bounds & Overlap Enforcement ✅
- `placementWithinBounds()` in `grid.ts` ensures parts stay within panel edges (+1mm margin)
- `boxesOverlap()` in `grid.ts` prevents overlapping placements
- Enforced on: click-to-place (`PanelCanvas.tsx:99-108`), drag-end (`PanelCanvas.tsx:184-192`), ghost validation

### 0.4 — Ghost Validity Colors (Green/Red) ✅
`PlacementGhost.tsx` renders the ghost with:
- Green fill/stroke when `valid = true` (in bounds + no overlap)
- Red fill/stroke when `valid = false`
- Validity computed in `PanelCanvas.tsx:142-157` on every mousemove during place mode

### 0.5 — Delete Keyboard Shortcut ✅
`Delete` / `Backspace` triggers `deleteSelected()` in `Toolbar.tsx`.
Ignores keypresses inside `<input>` / `<textarea>`. Removes from whichever layer the placement belongs to.

---

## Phase 1 — KiCad PCB Export ✅
`src/utils/export/kicad-pcb.ts` generates a full `.kicad_pcb` file including:
- Panel outline on `Edge.Cuts`
- Mounting holes (via `computeMountingHoles`)
- PCB component footprints with pads, reference designators, and 3D models
- Interface components as silkscreen virtual footprints
- Panel cutouts as NPTH pads
- Toolbar button calls `exportKicadPcb()` + `downloadFile()`

---

## Phase 2 — Right-Side Panel (Panel Settings + Placement Properties) ✅

### Sub-tasks:
- [x] Create `PropertiesPanel.tsx` component in `src/components/PropertiesPanel/`
- [x] Build panel settings section: format, HP, name, author
- [x] Build placement properties section: position (x/y), rotation, locked toggle
- [x] Wire up selection state from `uiStore.selectedPlacementIds`
- [x] Show placement fields only when a single placement is selected
- [x] Add to `App.tsx` layout (right sidebar, ~280px width)

### Files:
- `src/components/PropertiesPanel/PropertiesPanel.tsx`
- `src/App.tsx`
- `src/stores/panelStore.ts` (added `setPanelAuthor` action)

---

## Phase 3 — Save/Load (Manual) ✅

### Sub-tasks:
- [x] Create `serialization.ts` with panel JSON codec + IndexedDB CRUD
- [x] Add `newPanel`, `saveToDB`, `loadFromDB`, `loadFromObject`, `refreshPanelList`, `deleteFromDB` actions to panelStore
- [x] Toolbar buttons: +New, Save, Load (dropdown list), Export JSON, Import JSON
- [x] Click-outside closes the load dropdown
- [x] Delete button per saved panel in the load list

### Files:
- `src/utils/serialization.ts` — `SavedPanelDoc`, `PanelRecord`, codec functions, IndexedDB storage, file export/import helpers
- `src/stores/panelStore.ts` — added save/load/new actions + `savedPanelList` state
- `src/components/Toolbar/Toolbar.tsx` — added save/load/export/import UI

---

## Phase 4 — SVG / PDF Export 🔲

### Sub-tasks:
- [ ] SVG export: render current canvas to SVG string (via Konva `.toSVG()` or manual)
- [ ] PDF export: render to offscreen canvas → `jsPDF` or print
- [ ] Export buttons in toolbar
- [ ] Include mounting holes, panel outline, all visible placements

### Files:
- `src/utils/export/svg.ts` (new)
- `src/utils/export/pdf.ts` (new)
- `src/components/Toolbar/Toolbar.tsx` (add export buttons)

---

## Phase 5 — 3D Viewer 🔲

### Sub-tasks:
- [ ] Embed Three.js canvas in a panel/tab
- [ ] Load referenced `.3dshapes` models by part
- [ ] Render panel substrate as a thin box
- [ ] Orbit controls for rotation/zoom
- [ ] Sync with current panel state (placements, positions)

### Files:
- `src/components/Viewer3D/Viewer3D.tsx` (new)
- `src/App.tsx` (add tab/view toggle)

---

## Phase 6 — Pairing Management 🔲

### Sub-tasks:
- [ ] Pairing UI to link interface + PCB parts (e.g. a jack's nut on interface layer, body on PCB layer)
- [ ] Store `ComponentPairing` entries in panel state
- [ ] Paired placement: moving one moves the other by `(dx, dy)` offset
- [ ] UI to create/edit/delete pairings
- [ ] `couplingGroup` matching already partially supported in `PanelCanvas.tsx:112-118`

### Files:
- `src/core/types/part.ts` — `ComponentPairing` type exists
- `src/core/pairing-utils.ts` — helpers exist (`findPairedParts`, `findPanelCutoutPart`, `getPlacementLayers`)
- `src/components/PropertiesPanel/PairingEditor.tsx` (new)

---

## Legend
✅ = Implemented (code is in `src/`)
🔲 = Not yet started
