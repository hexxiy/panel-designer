import { usePanelStore } from '../../stores/panelStore'
import { formatMm } from '../../core/units'
import { getFormat } from '../../core/standards'

export function StatusBar() {
  const panel = usePanelStore(s => s.panel)
  const format = getFormat(panel.format)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px var(--spacing-md)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.75rem',
        color: 'var(--color-text-dim)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span>{format.name} — {panel.dimensions.hp} HP</span>
      <span>
        {formatMm(panel.dimensions.actualWidthMm)} × {formatMm(panel.dimensions.heightMm)}
      </span>
    </div>
  )
}
