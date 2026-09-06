import { View, Text, StyleSheet } from 'react-native'
import type { DailySummary as DailySummaryType } from '@healthplan/core'
import { useTheme } from '../store/theme'
import { fmtKcal, fmtMacro } from '../lib/format'

export function DailySummary({ summary }: { summary?: DailySummaryType }) {
  const { colors } = useTheme()
  const total = summary?.total
  const share = summary?.share
  const hasData = !!total && total.kcal > 0

  const items = [
    { label: '碳水', value: total ? fmtMacro(total.carbs) : '0', color: colors.carbs },
    { label: '蛋白', value: total ? fmtMacro(total.protein) : '0', color: colors.protein },
    { label: '脂肪', value: total ? fmtMacro(total.fat) : '0', color: colors.fat },
  ]

  const segs = hasData && share
    ? [
        { key: 'carb', pct: share.carbs, color: colors.carbs },
        { key: 'protein', pct: share.protein, color: colors.protein },
        { key: 'fat', pct: share.fat, color: colors.fat },
      ]
    : []

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
      {/* 强调条 */}
      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.titleTag, { backgroundColor: colors.primaryFill }]} />
          <Text style={[styles.title, { color: colors.text }]}>当日汇总</Text>
          {hasData && (
            <View style={[styles.doneBadge, { backgroundColor: colors.primaryFill }]}>
              <Text style={[styles.doneText, { color: colors.primaryText }]}>✓ 已记录</Text>
            </View>
          )}
        </View>

        <View style={styles.kcalRow}>
          <Text style={[styles.kcal, { color: colors.primary }]}>
            {total ? fmtKcal(total.kcal) : '0'}
          </Text>
          <Text style={[styles.kcalUnit, { color: colors.muted }]}>kcal</Text>
        </View>

        <View style={styles.macroRow}>
          {items.map((it) => (
            <View key={it.label} style={[styles.macroItem, { backgroundColor: colors.cardAlt }]}>
              <View style={[styles.macroDot, { backgroundColor: it.color }]} />
              <Text style={[styles.macroLabel, { color: it.color }]}>{it.label}</Text>
              <Text style={[styles.macroValue, { color: colors.text }]}>
                {it.value}
                <Text style={[styles.macroUnit, { color: colors.muted }]}>g</Text>
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.shareHeader}>
          <Text style={[styles.shareTitle, { color: colors.muted }]}>供能占比</Text>
          {hasData && share && (
            <Text style={[styles.shareText, { color: colors.muted }]}>
              碳{share.carbs}% · 蛋{share.protein}% · 脂{share.fat}%
            </Text>
          )}
        </View>

        <View style={[styles.bar, { backgroundColor: colors.track }]}>
          {segs.map((s) => (
            <View
              key={s.key}
              style={{ width: `${s.pct}%`, height: '100%', backgroundColor: s.color }}
            />
          ))}
        </View>

        {!hasData && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={[styles.empty, { color: colors.placeholder }]}>
              今天还没有记录，加一条吧
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  accentBar: { height: 3 },
  body: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  titleTag: { width: 3.5, height: 14, borderRadius: 2 },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  doneBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  doneText: { fontSize: 10, fontWeight: '600' },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  kcal: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  kcalUnit: { fontSize: 14, fontWeight: '500' },
  macroRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  macroItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  macroDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
  macroLabel: { fontSize: 11, marginBottom: 2, fontWeight: '600' },
  macroValue: { fontSize: 16, fontWeight: '700' },
  macroUnit: { fontSize: 10, fontWeight: '400' },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 7,
  },
  shareTitle: { fontSize: 11 },
  shareText: { fontSize: 11 },
  bar: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  emptyEmoji: { fontSize: 14 },
  empty: { fontSize: 12 },
})
