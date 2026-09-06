/* 免 DB 冒烟测试：验证编译产物可加载、core 依赖图正常、搜索逻辑运行时可用 */
const { FoodsService } = require('../dist/foods/foods.service')
const { calcNutrition } = require('@healthplan/core')

const mockPrisma = { food: {} }

async function main() {
  const svc = new FoodsService(mockPrisma)

  const builtin = svc.getSystemFoods()
  console.log('[1] 系统食物总数:', builtin.length)

  const r1 = await svc.search('米饭', undefined, undefined)
  console.log('[2] 搜"米饭" =>', r1.length, '条, 首条:', r1[0] && r1[0].name)

  const r2 = await svc.search('gbjd', undefined, undefined)
  console.log('[3] 拼音"gbjd" =>', r2.map((f) => f.name).join(', '))

  const r3 = await svc.search('kfc', undefined, undefined)
  console.log('[4] 搜"kfc" =>', r3.map((f) => f.name).join(', '))

  const rice = builtin.find((f) => f.id === 'staple-rice-steamed')
  const n = calcNutrition(rice.per100g, 200)
  console.log('[5] 米饭200g 营养:', JSON.stringify(n))

  const r4 = await svc.search('', 'fruit', undefined)
  console.log('[6] 分类筛选 fruit =>', r4.length, '条')
}

main().catch((e) => {
  console.error('SMOKE FAILED:', e)
  process.exit(1)
})
