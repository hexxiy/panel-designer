# Panel Designer — App Structure

```
src/
├── main.tsx                          # Entry point → renders <App/>
├── App.tsx                           # Root layout: Toolbar + PartsBrowser + Canvas + PropertiesPanel + StatusBar
│
├── core/                             # Pure domain logic (no React)
│   ├── types/                        #   Panel, Layer, Placement, Part, Format, Pad, etc.
│   ├── standards/                    #   Eurorack / 4U / Buchla format specs
│   ├── units.ts                      #   HP ↔ mm ↔ inch conversions
│   ├── grid.ts                       #   Grid snapping, bounding box, overlap detection
│   ├── panel-utils.ts                #   Mounting hole computation
│   ├── pairing-utils.ts              #   Cross-layer part coupling
│   ├── library-parts.ts              #   Loads .kicad_mod files from /parts
│   └── sample-parts.ts               #   Fallback parts (pot, jack, switch, LED...)
│
├── stores/                           # Zustand state management
│   ├── panelStore.ts                 #   Panel document + undo/redo stack + IndexedDB persistence
│   ├── partsLibraryStore.ts          #   Parts catalog, search, import
│   ├── uiStore.ts                    #   Active tool, selection, zoom/pan, layer visibility
│   └── themeStore.ts                 #   Dark/light/grey themes
│
├── components/
│   ├── Toolbar/                      #   Top bar: format/HP, tool select, undo/redo, save/load, export
│   ├── PartsLibrary/                 #   Left sidebar: parts list + LayerControls
│   ├── Editor/                       #   Center Konva canvas
│   │   ├── PanelCanvas.tsx           #     Stage, zoom/pan, click-to-place, drag, selection
│   │   ├── PanelGrid.tsx             #     Background grid lines
│   │   ├── PlacementNode.tsx         #     Renders a single placed part (pads, silkscreen, drag)
│   │   ├── PlacementGhost.tsx        #     Green/red ghost preview while placing
│   │   ├── MountingHoles.tsx         #     Mounting hole circles
│   │   └── panelView.ts             #     Coordinate transforms (panel ↔ stage)
│   ├── LayerPanel/                   #   Layer visibility, active layer, overlay mode, height
│   ├── PropertiesPanel/              #   Right sidebar: panel settings, placement props
│   └── StatusBar/                    #   Bottom bar: format/HP/dimensions
│
├── utils/
│   ├── download.ts                   #   Blob download helper
│   ├── serialization.ts              #   JSON codec + IndexedDB CRUD
│   └── export/
│       ├── kicad-pcb.ts              #   KiCad 9 .kicad_pcb generator (3 export modes)
│       └── s-expr-builder.ts         #   S-expression pretty-printer
│
└── parsers/kicad/                    # KiCad file parser
    ├── lexer.ts → parser.ts → mapper.ts   # .kicad_mod → domain objects
    └── types.ts                      #   Intermediate token/SExpr types
```

## Data Flow

User actions → Zustand stores → React re-render → Konva canvas.

Persistence: `serialization.ts` (IndexedDB for saves, blob downloads for JSON/KiCad exports).

Parts: loaded from `/parts/*.kicad_mod` files (fallback to `sample-parts.ts`).

## Key Stack

| Layer | Role |
|---|---|
| **`core/`** | Pure domain logic — types, units, grid, standards, pairing, mounting holes. Zero React dependency. |
| **`stores/`** | Four Zustand stores for panel state, parts library, UI state, and theme. |
| **`components/`** | React UI: Toolbar (top), StatusBar (bottom), PartsBrowser (left), PanelCanvas (center Konva), PropertiesPanel (right). |
| **`utils/export/`** | KiCad 9 PCB S-expression generator with 3 export modes (full, panel-only, components-only). |
| **`parsers/kicad/`** | Full KiCad footprint parser: lexer → parser (S-expr tree) → mapper (domain Part objects). |
