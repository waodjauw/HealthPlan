import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../store/theme'
import { fmtKcal, fmtMacro } from '../lib/format'
import { catIcon } from '../lib/foodMeta'
import type { LogItem } from '../lib/api'

interface Props {
  items: LogItem[]
  onRemove: (id: string) => void
}

export function MealSection({ items, onRemove }: Props) {
  const { colors } = useTheme()

  const kcal = items.reduce((s, i) => s + i.nutrition.kcal, 0)

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primaryFill }]}>
          <Text style={styles.headerEmoji}>🍱</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>吃了什么</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {items.length} 条记录
          </Text>
        </View>
        <Text style={[styles.kcal, { color: colors.primary }]}>
          {fmtKcal(kcal)}
          <Text style={[styles.kcalUnit, { color: colors.muted }]}> kcal</Text>
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyEmoji}>🥗</Text>
          <Text style={[styles.empty, { color: colors.placeholder }]}>
            今天还没记录，点右下角 ＋ 添加
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.row, { borderTopColor: colors.divider }]}>
            <View style={[styles.tile, { backgroundColor: colors.cardAlt }]}>
              <Text style={styles.tileEmoji}>{catIcon(item.category)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.foodName}
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]}>
                {fmtMacro(item.grams)}g · 碳{fmtMacro(item.nutrition.carbs)} 蛋
                {fmtMacro(item.nutrition.protein)} 脂{fmtMacro(item.nutrition.fat)}
              </Text>
            </View>
            <Text style={[styles.rowKcal, { color: colors.text }]}>
              {fmtKcal(item.nutrition.kcal)}
            </Text>
            <TouchableOpacity
              onPress={() => onRemove(item.id)}
              style={[styles.delBtn, { backgroundColor: colors.cardAlt }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.delText, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: { fontSize: 17 },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 18 },
  sub: { fontSize: 11, marginTop: 1 },
  kcal: { fontSize: 16, fontWeight: '700' },
  kcalUnit: { fontSize: 11, fontWeight: '500' },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  emptyEmoji: { fontSize: 22 },
  empty: { fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: { fontSize: 17 },
  name: { fontSize: 14, fontWeight: '500' },
  meta: { fontSize: 11, marginTop: 2 },
  rowKcal: { fontSize: 14, fontWeight: '700' },
  delBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { fontSize: 11, lineHeight: 13 },
})
