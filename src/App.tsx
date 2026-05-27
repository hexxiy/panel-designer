import { Toolbar } from './components/Toolbar/Toolbar'
import { PanelCanvas } from './components/Editor/PanelCanvas'
import { StatusBar } from './components/StatusBar/StatusBar'
import { PartsBrowser } from './components/PartsLibrary/PartsBrowser'
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel'

export default function App() {
  return (
    <>
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PartsBrowser />
        <PanelCanvas />
        <PropertiesPanel />
      </div>
      <StatusBar />
    </>
  )
}
