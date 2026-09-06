# HealthPlan

记录每天吃了什么，算出热量与碳水/蛋白/脂肪。Web + 安卓双端，电脑/平板/手机三端响应式。

- 需求与技术方案：[docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md)
- UI 设计规范：[docs/UI_SPEC.md](docs/UI_SPEC.md)
- 后端接口文档：[docs/API.md](docs/API.md)
- 全部文档索引：[docs/README.md](docs/README.md)

## 技术选型

| 层 | 选型 |
|---|---|
| 包管理 | yarn 4 workspaces（`nodeLinker: node-modules`） |
| `packages/core` | 纯 TypeScript：领域类型、营养计算、中文搜索、内置食物数据集 |
| `apps/api` | NestJS + Prisma + PostgreSQL（P2，已完成） |
| `apps/web` | Vite + React 18 + TS + Tailwind（P3，已完成） |
| `apps/mobile` | Expo SDK 57 (React Native 0.86)（P4，已完成） |

`core` 是两端共用的地基：营养计算、搜索匹配、食物数据结构只写一份，Web 和安卓都 import 它。

> `core` 产出 **ESM + CJS 双产物**：NestJS（CJS）走 `dist/index.js`，Vite 走 `dist/esm/index.js`，Metro/RN 走 `exports["react-native"]` 条件。改了 core 源码后要重新 `yarn build`（在 `packages/core` 下）。

## 快速开始

```bash
yarn install

# 运行 core 单元测试
cd packages/core && yarn test

# 类型检查
cd packages/core && yarn typecheck
```

> Windows 下若 `yarn test` 报找不到命令，用 `node ../../node_modules/vitest/vitest.mjs run`。

### 各端启动

```bash
# 后端 API（需先配 DATABASE_URL，见 apps/api/.env.example）
cd apps/api && yarn dev        # 默认 http://localhost:3000

# Web 端（Vite dev）
cd apps/web && yarn dev        # 默认 http://localhost:5173

# 安卓端（Expo）
cd apps/mobile && yarn start   # 手机装 Expo Go 扫码，或按 a 起模拟器
```

> 安卓真机调试时，手机与电脑需同一 WiFi，并把 `apps/mobile/src/config.ts` 的 `API_BASE` 改成电脑局域网 IP。模拟器用默认 `10.0.2.2:3000` 即可。
>
> **出 APK**：本机装好 Android Studio/SDK 后 `cd apps/mobile && pnpm android`（`expo run:android`）构建 debug APK；或连 Expo 账号用 `eas build -p android` 出 release。代码已在 `npx expo export` 下验证 Metro 可正常打包。

## 当前进度

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | Monorepo 骨架 | 完成 |
| P1 | core + 内置食物数据集 | 完成（232 条，32 个单测全绿） |
| P2 | NestJS API | 完成（Auth + Foods + Logs + Summary） |
| P3 | Web 端 | 完成（登录/注册/记录/汇总/响应式/暗色） |
| P4 | 安卓端 | 完成（Expo RN，代码 + 类型检查 + Metro 打包验证） |

## core 用法示例

```ts
import { BUILTIN_FOODS, searchFoods, calcNutrition, summarizeDay } from '@healthplan/core'

const [food] = searchFoods(BUILTIN_FOODS, '宫保鸡丁')   // 也支持 'gbjd'
const nutrition = calcNutrition(food.per100g, 300)       // { kcal: 390, carbs: 24, protein: 36, fat: 21 }

const summary = summarizeDay(entries, '2026-09-05')
summary.total.kcal   // 当日总热量
summary.share        // { carbs: 50, protein: 20, fat: 30 } 供能占比，总和 100
```

## 数据来源与免责

- 基础食材、家常菜：《中国食物成分表》公开数据（每 100g 可食部）
- 外卖与连锁饮品：品牌官网公示营养信息，条目带 `origin` 字段标注，**以官方最新公示为准**
- 数值为参考值，品种、部位、烹饪方式都会造成偏差，App 内需展示免责声明
