export function fmtKcal(v: number): string {
  return String(Math.round(v))
}

export function fmtMacro(v: number): string {
  return String(Math.round(v * 10) / 10)
}

/** YYYY-MM-DD 加减天数，纯字符串运算，避免时区偏移 */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const wd = WEEKDAYS[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]
  return `${m}月${d}日 ${wd}`
}

export function isToday(date: string, today: string): boolean {
  return date === today
}

export interface DayCell {
  iso: string
  inMonth: boolean
}

/** 以周一起始生成某月 42 格，UTC 运算避免时区偏移 */
export function monthGrid(year: number, month: number): DayCell[] {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const lead = (firstDow + 6) % 7
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const dt = new Date(Date.UTC(year, month, 1 - lead + i))
    cells.push({
      iso: dt.toISOString().slice(0, 10),
      inMonth: dt.getUTCMonth() === month,
    })
  }
  return cells
}
