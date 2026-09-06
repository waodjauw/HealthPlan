/** 分类 emoji 展示映射（mobile 各组件共用） */
export const CAT_ICONS: Record<string, string> = {
  staple: '🍚',
  meat: '🍗',
  bean: '🐟',
  vegetable: '🥦',
  fruit: '🍎',
  dairy: '🥛',
  drink: '🧃',
  snack: '🥜',
  dish: '🍲',
}

export function catIcon(code: string): string {
  return CAT_ICONS[code] ?? '🍽️'
}
