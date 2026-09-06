import { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { monthGrid } from '../lib/format'
import { useTheme } from '../store/theme'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

function ymOf(iso: string): { y: number; m: number } {
  const [y, m] = iso.split('-').map(Number)
  return { y: y!, m: (m! - 1 + 12) % 12 }
}

export function CalendarModal({
  visible,
  value,
  today,
  onPick,
  onClose,
}: {
  visible: boolean
  value: string
  today: string
  onPick: (iso: string) => void
  onClose: () => void
}) {
  const { colors } = useTheme()
  const [ym, setYm] = useState(() => ymOf(value))

  // 每次打开定位到当前选中日期所在月
  useEffect(() => {
    if (visible) setYm(ymOf(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const cells = monthGrid(ym.y, ym.m)

  function shiftMonth(delta: number) {
    const dt = new Date(Date.UTC(ym.y, ym.m + delta, 1))
    setYm({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() })
  }

  const todayInView = today.startsWith(
    `${ym.y}-${String(ym.m + 1).padStart(2, '0')}`,
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* 点空白关闭；卡片拦截触摸 */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}
          onStartShouldSetResponder={() => true}
        >
          {/* 年月切换 */}
          <View style={styles.head}>
            <TouchableOpacity
              onPress={() => shiftMonth(-1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.headBtn, { backgroundColor: colors.cardAlt }]}
            >
              <Text style={[styles.headNav, { color: colors.primary }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.headTitle, { color: colors.text }]}>
              {ym.y}年{ym.m + 1}月
            </Text>
            <TouchableOpacity
              onPress={() => shiftMonth(1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.headBtn, { backgroundColor: colors.cardAlt }]}
            >
              <Text style={[styles.headNav, { color: colors.primary }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 星期表头 */}
          <View style={styles.weekRow}>
            {WEEK.map((w, i) => (
              <Text
                key={w}
                style={[
                  styles.weekText,
                  { color: i === 6 ? '#E36D5B' : colors.muted },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* 日期格：42 = 6 行 x 7 */}
          {Array.from({ length: 6 }, (_, row) => (
            <View key={row} style={styles.weekRow}>
              {cells.slice(row * 7, row * 7 + 7).map((c) => {
                const selected = c.iso === value
                const isToday = c.iso === today
                const day = Number(c.iso.slice(8, 10))
                return (
                  <TouchableOpacity
                    key={c.iso}
                    onPress={() => onPick(c.iso)}
                    activeOpacity={0.7}
                    style={[
                      styles.day,
                      selected && { backgroundColor: colors.primary },
                      !selected &&
                        isToday && {
                          borderWidth: 1,
                          borderColor: colors.primary,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected
                          ? { color: colors.primaryInk, fontWeight: '600' }
                          : isToday
                            ? { color: colors.primary, fontWeight: '600' }
                            : c.inMonth
                              ? { color: colors.body }
                              : { color: colors.placeholder },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}

          {/* 今天快捷 */}
          <View style={[styles.foot, { borderTopColor: colors.divider }]}>
            <TouchableOpacity
              onPress={() => {
                const t = ymOf(today)
                setYm(t)
                onPick(today)
              }}
              disabled={todayInView}
              style={[
                styles.todayBtn,
                todayInView && { opacity: 0.35 },
              ]}
            >
              <Text style={[styles.todayText, { color: colors.primary }]}>
                回到今天
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 304,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headNav: { fontSize: 18, lineHeight: 20 },
  headTitle: { fontSize: 15, fontWeight: '600' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  weekText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 14 },
  foot: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  todayBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  todayText: { fontSize: 12, fontWeight: '500' },
})
