import type { Preset } from './tipos'

export function qualidadeDoPreset(preset: Preset): number {
  if (preset === 'leve') return 85
  if (preset === 'maxima') return 60
  return 75
}

export function nivelOxiPng(preset: Preset): number {
  if (preset === 'leve') return 1
  if (preset === 'maxima') return 3
  return 2
}
