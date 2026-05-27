import type { PanelFormatId } from '../../core/types'
import { getFormatIds } from '../../core/standards'
import { usePanelStore } from '../../stores/panelStore'

export function FormatSelector() {
  const panel = usePanelStore(s => s.panel)
  const setFormat = usePanelStore(s => s.setFormat)
  const setHp = usePanelStore(s => s.setHp)

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
      <select
        value={panel.format}
        onChange={e => setFormat(e.target.value as PanelFormatId)}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          padding: '4px 8px',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
        }}
      >
        {getFormatIds().map(id => (
          <option key={id} value={id}>
            {id === 'eurorack' ? 'Eurorack' : id === '4u' ? '4U' : 'Buchla'}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <input
          type="number"
          min={2}
          max={104}
          value={panel.dimensions.hp}
          onChange={e => setHp(Number(e.target.value))}
          style={{
            width: '60px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            padding: '4px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
          }}
        />
        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>HP</span>
      </div>
    </div>
  )
}
