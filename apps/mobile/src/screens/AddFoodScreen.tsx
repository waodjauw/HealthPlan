import { useEffect, useState } from 'react'
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  CATEGORIES,
  calcNutrition,
  searchFoods,
  type Food,
  type FoodCategoryCode,
} from '@healthplan/core'
import { useTheme } from '../store/theme'
import { foodsApi, logsApi } from '../lib/api'
import { fmtKcal, fmtMacro } from '../lib/format'
import { catIcon } from '../lib/foodMeta'
import type { RootStackParamList } from '../nav'

type Props = NativeStackScreenProps<RootStackParamList, 'AddFood'>
type TabKey = 'all' | 'mine' | FoodCategoryCode

interface CartItem {
  food: Food
  grams: number
}

const QUICK_WORDS = [
  '米饭',
  '面条',
  '鸡蛋',
  '鸡胸',
  '牛奶',
  '酸奶',
  '苹果',
  '香蕉',
  '燕麦',
  '番茄',
  '西兰花',
  '牛肉',
]

const TABS: { key: TabKey; label: string; icon?: string }[] = [
  { key: 'all', label: '全部', icon: '🍱' },
  ...CATEGORIES.map((c) => ({ key: c.code as TabKey, label: c.label, icon: catIcon(c.code) })),
  { key: 'mine', label: '我的', icon: '⭐' },
]

const EMPTY_FORM = {
  name: '',
  category: 'dish' as FoodCategoryCode,
  kcal: '',
  carbs: '',
  protein: '',
  fat: '',
}

function defaultGrams(food: Food): number {
  const def = food.servings?.find((s) => s.isDefault) ?? food.servings?.[0]
  return def?.grams ?? 100
}

function numOf(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function AddFoodScreen({ navigation, route }: Props) {
  const { date } = route.params
  const { colors } = useTheme()
  const { primaryInk } = colors
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [catalog, setCatalog] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [menuVersion, setMenuVersion] = useState(0) // 用于重挂列表后回到顶部

  useEffect(() => {
    let alive = true
    foodsApi
      .search('')
      .then((all) => {
        if (alive) setCatalog(all)
      })
      .catch(() => {
        if (alive) setCatalog([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const keyword = q.trim()
  const mine = catalog.filter((f) => f.source === 'user')

  const shown: Food[] = keyword
    ? searchFoods(catalog, keyword).slice(0, 40)
    : tab === 'all'
      ? catalog
      : tab === 'mine'
        ? mine
        : catalog.filter((f) => f.category === tab)

  function addToCart(food: Food, grams: number) {
    const g = numOf(String(grams))
    if (g <= 0) return
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.food.id === food.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { food, grams: g }
        return next
      }
      return [...prev, { food, grams: g }]
    })
  }

  function removeFromCart(foodId: string) {
    setCart((prev) => prev.filter((c) => c.food.id !== foodId))
  }

  function cartGramsOf(foodId: string): number | null {
    return cart.find((c) => c.food.id === foodId)?.grams ?? null
  }

  const totalKcal = cart.reduce(
    (s, c) => s + calcNutrition(c.food.per100g, c.grams).kcal,
    0,
  )

  const num = (v: string) => (v === '' ? 0 : Number(v))

  async function createFood() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const food = await foodsApi.create({
        name: form.name.trim(),
        category: form.category,
        per100g: {
          kcal: num(form.kcal),
          carbs: num(form.carbs),
          protein: num(form.protein),
          fat: num(form.fat),
        },
      })
      setCatalog((prev) => [food, ...prev])
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      addToCart(food, 100)
      setTab('mine')
      setQ('')
      setMenuVersion((v) => v + 1) // 重挂列表：回到顶部并可见新条目
    } finally {
      setCreating(false)
    }
  }

  async function submitAll() {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      await Promise.all(
        cart.map((c) =>
          logsApi.create({ foodId: c.food.id, date, grams: c.grams }),
        ),
      )
      navigation.goBack()
    } catch (err) {
      const raw = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message
      const msg = Array.isArray(raw) ? raw.join('；') : raw ?? '网络异常，请确认后端已启动'
      Alert.alert('记录失败', msg)
      setSubmitting(false)
    }
  }

  const inputStyle = [styles.input, { backgroundColor: colors.cardAlt, color: colors.text }]
  const muted = colors.muted
  const body = colors.body

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* 页头 */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.close, { color: colors.muted }]}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>点餐添加</Text>
        <View style={[styles.datePill, { backgroundColor: colors.cardAlt, borderColor: colors.divider }]}>
          <Text style={[styles.dateText, { color: colors.muted }]}>
            {date.slice(5).replace('-', '/')}
          </Text>
        </View>
      </View>

      {/* 搜索 */}
      <View style={[styles.searchWrap, { borderColor: colors.divider }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[inputStyle, styles.searchInput]}
          placeholder="搜索想吃的，中文 / 拼音首字母都行"
          placeholderTextColor={colors.placeholder}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
        {q.length > 0 && (
          <TouchableOpacity
            style={styles.searchClear}
            onPress={() => setQ('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.searchClearText, { color: colors.muted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 分类 tab */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }}
        >
          {TABS.map((t) => {
            const active = !keyword && tab === t.key
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tabChip,
                  { backgroundColor: active ? colors.primary : colors.cardAlt },
                ]}
                onPress={() => {
                  setTab(t.key)
                  setQ('')
                  setCreateOpen(false)
                  setMenuVersion((v) => v + 1)
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? primaryInk : colors.body },
                  ]}
                >
                  {t.icon ? `${t.icon} ` : ''}
                  {t.label}
                </Text>
              </TouchableOpacity>
            )
          })}
          {/* 自定义食物独立入口 */}
          <TouchableOpacity
            key="__new_food"
            style={[
              styles.tabChip,
              styles.newChip,
              { borderColor: colors.primary, backgroundColor: colors.bg },
            ]}
            onPress={() => {
              setCreateOpen(true)
              setForm({ ...EMPTY_FORM })
              setQ('')
            }}
          >
            <Text style={[styles.tabText, { color: colors.primary }]}>
              ＋ 新增自定义
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 列表 / 创建表单 */}
      {loading && catalog.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 48 }} />
      ) : createOpen ? (
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          <View style={[styles.createBox, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.createTitle, { color: colors.text }]}>创建自定义食物</Text>
            <Text style={[styles.createHint, { color: muted }]}>
              填每 100g 的营养值，创建后自动加入已选
            </Text>

            <Text style={[styles.fieldLabel, { color: muted }]}>名称</Text>
            <TextInput
              style={inputStyle}
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              placeholder="如：自制鸡胸肉沙拉"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={[styles.fieldLabel, { color: muted }]}>分类</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map((c) => {
                const active = form.category === c.code
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.primary : colors.cardAlt },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, category: c.code }))}
                  >
                    <Text style={[styles.chipText, { color: active ? '#FFFFFF' : body }]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: muted }]}>每 100g 营养（可留 0）</Text>
            <View style={styles.nutriRow}>
              {(
                [
                  ['kcal', '热量 kcal', form.kcal],
                  ['carbs', '碳水 g', form.carbs],
                  ['protein', '蛋白 g', form.protein],
                  ['fat', '脂肪 g', form.fat],
                ] as const
              ).map(([key, label, value]) => (
                <View key={key} style={styles.nutriItem}>
                  <TextInput
                    style={inputStyle}
                    value={String(value)}
                    onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
                    keyboardType="numeric"
                    placeholder={label}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.btnGhost, { borderColor: colors.divider }]}
                onPress={() => setCreateOpen(false)}
              >
                <Text style={[styles.btnGhostText, { color: muted }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={createFood}
                disabled={creating || !form.name.trim()}
              >
                <Text style={[styles.btnPrimaryText, { color: primaryInk }]}>
                  {creating ? '创建中…' : '创建并加入已选'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          key={String(menuVersion)}
        >
          {/* 全部 tab 下的快捷词 */}
          {!keyword && tab === 'all' && (
            <View style={styles.quickBox}>
              <Text style={[styles.quickLabel, { color: muted }]}>随便吃点</Text>
              <View style={styles.chipWrap}>
                {QUICK_WORDS.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.chip, { backgroundColor: colors.cardAlt }]}
                    onPress={() => setQ(w)}
                  >
                    <Text style={[styles.chipText, { color: body }]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!keyword && tab === 'mine' && mine.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🧂</Text>
              <Text style={[styles.empty, { color: muted }]}>
                还没有自定义食物，把搜不到的常吃食物建一个吧
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primaryFill }]}
                onPress={() => {
                  setCreateOpen(true)
                  setForm({ ...EMPTY_FORM })
                }}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryText }]}>
                  ＋ 新增自定义食物
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {shown.map((f) => (
            <FoodRow
              key={f.id}
              food={f}
              colors={colors}
              inCartGrams={cartGramsOf(f.id)}
              onAdd={addToCart}
              onRemoveFromCart={removeFromCart}
              onRemoveFood={(food) =>
                foodsApi.remove(food.id).then(() => {
                  setCatalog((prev) => prev.filter((x) => x.id !== food.id))
                  removeFromCart(food.id)
                })
              }
            />
          ))}

          {keyword && shown.length === 0 && !createOpen && (
            <View style={styles.emptyBox}>
              <Text style={[styles.empty, { color: muted }]}>
                没找到，试试换词，或把它建成自定义食物
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primaryFill }]}
                onPress={() => {
                  setForm({ ...EMPTY_FORM, name: keyword })
                  setCreateOpen(true)
                }}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryText }]}>
                  创建「{keyword}」
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* 底部已选条（外卖式） */}
      {cart.length > 0 && !createOpen && (
        <View style={[styles.cartBar, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cartChips}>
              {cart.map((c) => (
                <TouchableOpacity
                  key={c.food.id}
                  style={[styles.cartChip, { backgroundColor: colors.cardAlt }]}
                  onPress={() => removeFromCart(c.food.id)}
                >
                  <Text style={[styles.cartChipText, { color: body }]}>
                    {c.food.name} {c.grams}g ✕
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.cartRow}>
            <Text style={[styles.cartSum, { color: muted }]}>
              {cart.length} 项 · 约 {fmtKcal(totalKcal)} kcal
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={submitAll}
              disabled={submitting}
            >
              <Text style={styles.confirmText}>
                {submitting ? '添加中…' : `记录（${cart.length}）`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

// 单行食物 + 展开份量调整（外卖式行内展开，非弹窗）
function FoodRow({
  food,
  colors,
  inCartGrams,
  onAdd,
  onRemoveFromCart,
  onRemoveFood,
}: {
  food: Food
  colors: ReturnType<typeof useTheme>['colors']
  inCartGrams: number | null
  onAdd: (food: Food, grams: number) => void
  onRemoveFromCart: (foodId: string) => void
  onRemoveFood: (food: Food) => void
}) {
  const [open, setOpen] = useState(false)
  const [gText, setGText] = useState(String(inCartGrams ?? defaultGrams(food)))
  const { divider, cardAlt, text, muted, body, primary, primaryText, primaryFill } = colors

  const g = numOf(gText)
  const preview = g > 0 ? calcNutrition(food.per100g, g) : null
  const servings = food.servings ?? []

  function toggleOpen() {
    setGText(String(inCartGrams ?? defaultGrams(food)))
    setOpen((o) => !o)
  }

  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: divider }}>
      {/* 行主体：点击展开份量；右侧 + 快捷加默认份 */}
      <TouchableOpacity
        style={styles.foodRow}
        onPress={toggleOpen}
        activeOpacity={0.7}
      >
        <View style={[styles.tile, { backgroundColor: cardAlt }]}>
          <Text style={styles.tileEmoji}>{catIcon(food.category)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameLine}>
            <Text style={[styles.name, { color: text }]}>{food.name}</Text>
            {food.source === 'user' && (
              <Text style={[styles.mineTag, { color: primaryText, backgroundColor: primaryFill }]}>
                我的
              </Text>
            )}
          </View>
          <Text style={[styles.meta, { color: muted }]}>
            每100g {fmtKcal(food.per100g.kcal)} kcal · 碳{fmtMacro(food.per100g.carbs)} 蛋
            {fmtMacro(food.per100g.protein)} 脂{fmtMacro(food.per100g.fat)}
          </Text>
        </View>

        {inCartGrams != null ? (
          <View style={[styles.inCart, { backgroundColor: primaryFill }]}>
            <Text style={[styles.inCartText, { color: primaryText }]}>
              ✓ {inCartGrams}g
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addFab, { borderColor: primary }]}
            onPress={() => onAdd(food, defaultGrams(food))}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={[styles.addFabText, { color: primary }]}>＋</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* 展开份量面板 */}
      {open && (
        <View style={[styles.expand, { backgroundColor: colors.card, borderColor: divider }]}>
          <View style={styles.servingRow}>
            {servings.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[
                  styles.servingBtn,
                  { backgroundColor: String(s.grams) === gText ? primary : colors.card },
                ]}
                onPress={() => setGText(String(s.grams))}
              >
                <Text style={[styles.servingText, { color: String(s.grams) === gText ? '#FFFFFF' : body }]}>
                  {s.label} {s.grams}g
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gramRow}>
            <Text style={[styles.gramLabel, { color: muted }]}>克数</Text>
            <TextInput
              style={[styles.gramInput, { backgroundColor: colors.card, color: text }]}
              value={gText}
              onChangeText={setGText}
              keyboardType="numeric"
              placeholderTextColor={colors.placeholder}
            />
            <Text style={[styles.gramUnit, { color: muted }]}>g</Text>
            {preview && (
              <Text style={[styles.preview, { color: muted }]} numberOfLines={1}>
                约 {fmtKcal(preview.kcal)} kcal
              </Text>
            )}
          </View>

          <View style={styles.expandActions}>
            {inCartGrams != null && (
              <TouchableOpacity
                style={[styles.expBtnGhost, { borderColor: divider }]}
                onPress={() => {
                  onRemoveFromCart(food.id)
                  setOpen(false)
                }}
              >
                <Text style={[styles.expBtnGhostText, { color: muted }]}>✕ 移出已选</Text>
              </TouchableOpacity>
            )}
            {food.source === 'user' && (
              <TouchableOpacity
                style={[styles.expBtnGhost, { borderColor: divider }]}
                onPress={() =>
                  Alert.alert(
                    '删除自定义食物',
                    `确定删除「${food.name}」？已记录的条目不受影响。`,
                    [
                      { text: '取消', style: 'cancel' },
                      {
                        text: '删除',
                        style: 'destructive',
                        onPress: () => {
                          void onRemoveFood(food)
                          setOpen(false)
                        },
                      },
                    ],
                  )
                }
              >
                <Text style={[styles.expBtnGhostText, { color: '#E36D5B' }]}>删除此食物</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.expBtnPrimary, { backgroundColor: primary }]}
              onPress={() => {
                if (g > 0) {
                  onAdd(food, g)
                  setOpen(false)
                }
              }}
              disabled={g <= 0}
            >
              <Text style={styles.expBtnPrimaryText}>
                {inCartGrams != null ? `更新克数 ${g}g` : `加入已选 ${g}g`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: { fontSize: 14, width: 62 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  datePill: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateText: { fontSize: 11, fontWeight: '600' },
  searchWrap: { position: 'relative', marginHorizontal: 16, marginTop: 12 },
  searchIcon: { position: 'absolute', left: 13, top: 11, fontSize: 14, zIndex: 1 },
  searchClear: {
    position: 'absolute',
    right: 8,
    top: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(127,127,127,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  searchClearText: { fontSize: 10, lineHeight: 12 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchInput: { borderRadius: 14, paddingLeft: 38, paddingRight: 34 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: { fontSize: 13, fontWeight: '500' },
  newChip: { borderWidth: 1 },
  scroll: { flex: 1, marginTop: 6 },
  quickBox: { paddingHorizontal: 16, paddingTop: 10 },
  quickLabel: { fontSize: 12, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 13 },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: { fontSize: 18 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15 },
  mineTag: {
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meta: { fontSize: 11, marginTop: 3 },
  addFab: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFabText: { fontSize: 19, lineHeight: 21 },
  inCart: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  inCartText: { fontSize: 12, fontWeight: '600' },
  expand: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  servingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servingBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  servingText: { fontSize: 12, fontWeight: '500' },
  gramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  gramLabel: { fontSize: 13 },
  gramInput: {
    width: 90,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 15,
    textAlign: 'center',
  },
  gramUnit: { fontSize: 13 },
  preview: { fontSize: 12, flex: 1, textAlign: 'right' },
  expandActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  expBtnGhost: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  expBtnGhostText: { fontSize: 13 },
  expBtnPrimary: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  expBtnPrimaryText: { fontSize: 14, fontWeight: '700' },
  emptyHint: { fontSize: 12, textAlign: 'center', marginTop: 32, paddingHorizontal: 32 },
  emptyBox: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  empty: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  emptyBtnText: { fontSize: 14, fontWeight: '600' },
  cartBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  cartChips: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  cartChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cartChipText: { fontSize: 12 },
  cartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cartSum: { fontSize: 12, flexShrink: 1, marginRight: 8 },
  confirmBtn: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 11 },
  confirmText: { fontSize: 14, fontWeight: '700' },
  createBox: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  createTitle: { fontSize: 16, fontWeight: '700' },
  createHint: { fontSize: 12, marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 7 },
  nutriRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutriItem: { width: '47%' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnGhost: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnGhostText: { fontSize: 14 },
  btnPrimary: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '700' },
})
