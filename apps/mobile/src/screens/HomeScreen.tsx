import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { todayISODate } from '@healthplan/core'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../store/auth'
import { useTheme } from '../store/theme'
import { logsApi, type LogItem } from '../lib/api'
import { formatDateLabel, isToday, shiftDate } from '../lib/format'
import { DailySummary } from '../components/DailySummary'
import { MealSection } from '../components/MealSection'
import { CalendarModal } from '../components/CalendarModal'
import type { RootStackParamList } from '../nav'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const { colors, toggle, isDark } = useTheme()
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const [date, setDate] = useState(todayISODate())
  const [calOpen, setCalOpen] = useState(false)

  // 从添加页返回后自动刷新
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['logs', date] })
      qc.invalidateQueries({ queryKey: ['summary', date] })
    }, [qc, date]),
  )

  const logsQuery = useQuery<LogItem[]>({
    queryKey: ['logs', date],
    queryFn: () => logsApi.list(date),
  })
  const summaryQuery = useQuery({
    queryKey: ['summary', date],
    queryFn: () => logsApi.summary(date),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => logsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logs', date] })
      qc.invalidateQueries({ queryKey: ['summary', date] })
    },
  })

  const items = logsQuery.data ?? []
  const loading = logsQuery.isLoading
  const today = todayISODate()
  const todayFlag = date === today

  const topBar = (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <View style={[styles.logo, { backgroundColor: colors.primaryFill }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>轻</Text>
        </View>
        <View>
          <Text style={[styles.brand, { color: colors.text }]}>轻卡</Text>
          <Text style={[styles.user, { color: colors.muted }]}>
            {user?.username} · {todayFlag ? '今天' : '历史'}
          </Text>
        </View>
      </View>
      <View style={styles.topActions}>
        <TouchableOpacity
          onPress={toggle}
          style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.divider }]}
        >
          <Text style={[styles.chipText, { color: colors.primary }]}>
            {isDark ? '☀️ 亮色' : '🌙 暗色'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={logout}
          style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.divider }]}
        >
          <Text style={[styles.chipText, { color: colors.muted }]}>退出</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const header = (
    <View style={styles.headerWrap}>
      <View style={[styles.datePill, { backgroundColor: colors.card, borderColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.cardAlt }]}
          onPress={() => setDate((d) => shiftDate(d, -1))}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.nav, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setCalOpen(true)}
          activeOpacity={0.6}
        >
          <View style={[styles.dot, { backgroundColor: todayFlag ? colors.primary : colors.placeholder }]} />
          <Text style={[styles.date, { color: colors.text }]}>{formatDateLabel(date)}</Text>
        </TouchableOpacity>
        {!todayFlag && (
          <TouchableOpacity
            onPress={() => setDate(today)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.backTodayBtn}
          >
            <Text style={[styles.backToday, { color: colors.primary }]}>回今天</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.cardAlt }]}
          onPress={() => setDate((d) => shiftDate(d, 1))}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.nav, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const mealList = <MealSection items={items} onRemove={(id) => removeMutation.mutate(id)} />

  const fab = (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={() => navigation.navigate('AddFood', { date })}
      activeOpacity={0.85}
    >
      <Text style={[styles.fabText, { color: colors.primaryInk }]}>＋</Text>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {topBar}
      {header}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : isTablet ? (
        <View style={styles.tablet}>
          <ScrollView style={styles.tabletLeft} contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
            {mealList}
          </ScrollView>
          <View style={styles.tabletRight}>
            <DailySummary summary={summaryQuery.data} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <DailySummary summary={summaryQuery.data} />
          <View style={{ height: 14 }} />
          {mealList}
        </ScrollView>
      )}

      {fab}

      {/* 日期选择日历 */}
      <CalendarModal
        visible={calOpen}
        value={date}
        today={today}
        onPick={(iso) => {
          setDate(iso)
          setCalOpen(false)
        }}
        onClose={() => setCalOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 19, fontWeight: '800' },
  brand: { fontSize: 15, fontWeight: '700', lineHeight: 19 },
  user: { fontSize: 11, marginTop: 1 },
  topActions: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 12 },
  headerWrap: { alignItems: 'center', paddingVertical: 12 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: { fontSize: 18, lineHeight: 20 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  date: { fontSize: 15, fontWeight: '600' },
  backTodayBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  backToday: { fontSize: 11 },
  tablet: { flex: 1, flexDirection: 'row' },
  tabletLeft: { flex: 1.4 },
  tabletRight: { flex: 1, padding: 16, paddingBottom: 96 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#052E22',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontSize: 30, lineHeight: 32, fontWeight: '300' },
})
