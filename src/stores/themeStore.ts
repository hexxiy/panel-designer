import { create } from 'zustand'

export type ThemeId = 'dark' | 'light' | 'grey'

export interface ThemeColors {
  bg: string
  surface: string
  border: string
  text: string
  textDim: string
  accent: string
  accentHover: string
  danger: string
  success: string
  warning: string
}

const THEMES: Record<ThemeId, ThemeColors> = {
  dark: {
    bg: '#1a1a1a',
    surface: '#222',
    border: '#333',
    text: '#e0e0e0',
    textDim: '#888',
    accent: '#a0a0a0',
    accentHover: '#ccc',
    danger: '#cc5555',
    success: '#55aa55',
    warning: '#ccaa44',
  },
  light: {
    bg: '#f5f5f5',
    surface: '#fff',
    border: '#ddd',
    text: '#1a1a1a',
    textDim: '#888',
    accent: '#555',
    accentHover: '#333',
    danger: '#cc3333',
    success: '#338833',
    warning: '#cc8800',
  },
  grey: {
    bg: '#2d2d2d',
    surface: '#3a3a3a',
    border: '#4a4a4a',
    text: '#d4d4d4',
    textDim: '#999',
    accent: '#aaa',
    accentHover: '#ccc',
    danger: '#cc6666',
    success: '#66aa66',
    warning: '#ccaa44',
  },
}

function applyTheme(themeId: ThemeId): void {
  const colors = THEMES[themeId]
  const root = document.documentElement
  root.style.setProperty('--color-bg', colors.bg)
  root.style.setProperty('--color-surface', colors.surface)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-text-dim', colors.textDim)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-accent-hover', colors.accentHover)
  root.style.setProperty('--color-danger', colors.danger)
  root.style.setProperty('--color-success', colors.success)
  root.style.setProperty('--color-warning', colors.warning)
}

interface ThemeState {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  applyTheme('dark')
  return {
    themeId: 'dark' as ThemeId,
    setTheme: (id) => {
      applyTheme(id)
      set({ themeId: id })
    },
    cycleTheme: () => {
      const order: ThemeId[] = ['dark', 'light', 'grey']
      const current = get().themeId
      const next = order[(order.indexOf(current) + 1) % order.length]
      applyTheme(next)
      set({ themeId: next })
    },
  }
})
