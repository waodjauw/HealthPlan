export type ThemeMode = 'light' | 'dark' | 'system'

export interface Palette {
  bg: string
  card: string
  cardAlt: string
  text: string
  body: string
  muted: string
  placeholder: string
  divider: string
  primary: string
  /** 主色背景之上按钮/徽标文字色 */
  primaryInk: string
  primaryFill: string
  primaryText: string
  track: string
  carbs: string
  protein: string
  fat: string
}

export const lightPalette: Palette = {
  bg: '#FFFFFF',
  card: '#FAFAF8',
  cardAlt: '#F1EFE8',
  text: '#2C2C2A',
  body: '#5F5E5A',
  muted: '#888780',
  placeholder: '#B4B2A9',
  divider: 'rgba(0,0,0,0.07)',
  primary: '#0F6E56',
  primaryInk: '#FFFFFF',
  primaryFill: '#E1F5EE',
  primaryText: '#04342C',
  track: '#F1EFE8',
  carbs: '#BA7517',
  protein: '#378ADD',
  fat: '#D85A30',
}

export const darkPalette: Palette = {
  bg: '#1F1F1D',
  card: '#2C2C2A',
  cardAlt: '#3A3A37',
  text: '#E8E6E1',
  body: '#D3D1C7',
  muted: '#9A988F',
  placeholder: '#888780',
  divider: 'rgba(255,255,255,0.08)',
  primary: '#5DCAA5',
  primaryInk: '#0A3A2E',
  primaryFill: '#0A3A2E',
  primaryText: '#9FE1CB',
  track: '#0F4A3B',
  carbs: '#EF9F27',
  protein: '#85B7EB',
  fat: '#F0997B',
}

