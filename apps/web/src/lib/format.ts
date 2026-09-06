export function fmtKcal(n: number): string {
  return Math.round(n).toLocaleString('zh-CN')
}

export function fmtMacro(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1)
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface DayCell {
  iso: string
  inMonth: boolean
}

/** 以周一为一周起点，生成展示某月所需的 42 格日历 */
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7 // 周一 = 0
  const start = new Date(year, month, 1 - lead)
  const out: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    out.push({ iso: toISO(d), inMonth: d.getMonth() === month })
  }
  return out
}

/** "9月6日 · 周六"，附 today 时显示「今天」 */
export function formatDateCN(date: string, today?: string): string {
  const d = new Date(date + 'T00:00:00')
  if (today && date === today) return '今天'
  if (today) {
    const t = new Date(today + 'T00:00:00')
    const diff = Math.round((d.getTime() - t.getTime()) / 86400000)
    if (diff === 1) return '明天'
    if (diff === -1) return '昨天'
  }
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${WEEKDAYS[d.getDay()]}`
}

export function todayStr(): string {
  return toISO(new Date())
}

export function shiftDate(date: string, delta: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return toISO(d)
}
