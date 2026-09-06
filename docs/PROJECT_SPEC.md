# HealthPlan · 饮食记录与碳蛋脂追踪

> 定位：**只做一件事**——记录每天吃了什么，算出热量与碳水/蛋白/脂肪。不搞社区、不搞电商、不做体重管理。

---

## 1. 已确认决策

| 项 | 决定 |
|---|---|
| 产品范围 | 食物记录 + 当日热量/碳蛋脂汇总（无目标设定、无体重管理） |
| 食物数据 | 内置离线数据集 **150~250 条** + 用户自定义（**完全私有**） |
| 外卖数据 | 只收录**官网明标**营养信息的（肯德基/麦当劳/瑞幸/喜茶等） |
| 架构 | **Monorepo**：`core`（纯 TS 共享）+ `api` + `web` + `mobile` |
| 后端 | NestJS + Prisma + PostgreSQL（Neon 免费版） |
| 账号 | 邮箱/用户名 + 密码（bcrypt）+ JWT |
| 安卓 | Expo (React Native)，与 Web **共享 core，UI 各写一套** |
| Web | Vite + React 18 + TS SPA（不用 Next.js，无 SSR 需求） |
| 响应式 | 真三端：手机单栏 / 平板双栏 / 电脑三栏 |
| 主题 | 亮色 + 暗色，可手动设置，也可跟随系统 |
| 动画 | 适度：转场、列表进场、数字滚动、进度环、按压反馈 |
| 份量输入 | 预设份量一键选（如"一碗 200g"）+ 可手改克数 |
| 部署 | Render（API + Web 静态站）+ Neon（Postgres） |
| 开发顺序 | core → api → web → mobile |

---

## 2. 功能范围

### 2.1 MVP 验收清单（全部跑通才算第一版完成）

- [ ] **注册 / 登录 / 登出**
  - 用户名 + 邮箱（邮箱可选）+ 密码
  - 密码 bcrypt 加盐哈希，绝不存明文
  - JWT 鉴权，access token 短期 + refresh token 续期
- [ ] **食物搜索与选择**
  - 内置库中文模糊搜索，支持别名与拼音首字母（如 `jbd` → 鸡蛋饼）
  - 按分类筛选、常用/最近记录优先
- [ ] **自定义食物（增 / 删 / 改）**
  - 字段：名称、分类、每 100g 的 热量/碳水/蛋白/脂肪
  - 可设置常用份量单位（如"一个 50g"）
  - **仅创建者可见**
- [ ] **每日记录 + 当日汇总**
  - 记录不分餐次，平铺成"今天吃了什么"一张列表
  - 选份量或从搜索结果直接记，克数可手改
  - 当日总热量 + 碳蛋脂总量展示（数字 + 进度条/环形图）
  - 可切换日期查看/补记历史

### 2.2 明确不做（别中途加）

- 体重记录、BMI、减重曲线
- 每日营养目标 / BMR / TDEE 计算
- 减肥社区、内容、打卡
- 拍照识别、条码扫描
- 电商、会员、付费

> 说明：不做目标设定 = 当日汇总**只显示摄入量**，不显示"还剩多少"。这是 MVP 与薄荷最大的体验差异，先接受。

### 2.3 v2 候选（做完 MVP 再说）

目标设定与达成率、体重曲线、7/30 天趋势图、数据导出 CSV、自定义食物分享到公共库、桌面端快捷键、小组件。

---

## 3. 技术架构

### 3.1 仓库结构

```
HealthPlan/
├── packages/
│   └── core/                 # 纯 TS，两端共用，零框架依赖
│       ├── types/            # Food / FoodLog / Nutrition 等领域类型
│       ├── nutrition.ts      # 营养计算（纯函数）
│       ├── search.ts         # 中文模糊匹配 + 拼音首字母
│       ├── constants.ts      # 分类、餐次、单位
│       └── data/
│           └── foods.json    # 内置食物数据集 150~250 条
├── apps/
│   ├── api/                  # NestJS + Prisma
│   ├── web/                  # Vite + React 18 SPA
│   └── mobile/               # Expo (React Native)
├── docs/
└── package.json              # pnpm workspace
```

**core 是整个方案的地基**——营养计算、搜索匹配、食物数据结构只写一次，Web 和安卓都 import 它。UI 各写一套，但业务规则不会分叉。

### 3.2 各包选型

| 包 | 技术 | 说明 |
|---|---|---|
| core | TypeScript | 纯函数，无副作用，可单测 |
| api | NestJS + Prisma + PostgreSQL + JWT + bcrypt | 模块化：auth / foods / logs / summary |
| web | Vite + React 18 + TS + Tailwind CSS + TanStack Query + Zustand + Framer Motion | Tailwind 断点做三端布局 |
| mobile | Expo (RN) + React Navigation + TanStack Query + Zustand + Reanimated 3 | 复用 core 与 api client |
| 包管理 | pnpm workspace | 你用过 yarn workspaces，pnpm 更快且磁盘占用低 |

---

## 4. 数据模型（Prisma 草案）

```prisma
model User {
  id           String   @id @default(cuid())
  email        String?  @unique
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  foods        Food[]
  logs         FoodLog[]
}

model Food {
  id        String   @id @default(cuid())
  name      String
  aliases   String[]              // 搜索别名
  category  String                // 见 §6 分类
  kcal      Float                 // 每 100g
  carbs     Float
  protein   Float
  fat       Float
  source    String                // 'system' | 'user'
  ownerId   String?               // source='user' 时必填
  owner     User?    @relation(fields: [ownerId], references: [id])
  servings  Serving[]
  createdAt DateTime @default(now())

  @@index([category])
  @@index([ownerId])
}

model Serving {                   // 预设份量
  id     String @id @default(cuid())
  foodId String
  food   Food   @relation(fields: [foodId], references: [id])
  label  String                   // "一碗" / "一个"
  grams  Float
  isDefault Boolean @default(false)
}

model FoodLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  foodId    String
  foodName  String
  category  String
  date      String                 // 'YYYY-MM-DD'，按用户本地日期
  grams     Float
  nutrition Json                   // 按记录时克数算好的营养快照
  createdAt DateTime @default(now())

  @@index([userId, date])
}
```

**关键设计**

- 营养值按记录当时的克数**算好存快照**（`nutrition Json`），展示直接读快照、不再回查食物数据。
- `date` 用 `YYYY-MM-DD` 字符串而非 DateTime，避开时区把"今天"算错的经典坑。
- 查询食物：`WHERE source='system' OR ownerId = :me`，这就是"自定义完全私有"的实现。

---

## 5. API 设计

### 鉴权
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/register` | 用户名 + 密码（邮箱可选） |
| POST | `/auth/login` | 返回 access + refresh token |
| POST | `/auth/refresh` | 换新 access token |
| GET | `/auth/me` | 当前用户 |

### 食物
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/foods?q=&category=` | 系统库 + 我的自定义，支持关键词 |
| GET | `/foods/:id` | 详情（含份量） |
| POST | `/foods` | 创建自定义食物 |
| PATCH | `/foods/:id` | 只能改自己创建的 |
| DELETE | `/foods/:id` | 只能删自己创建的 |

### 记录
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/logs` | 记一条（foodId + grams + date，不分餐次） |
| GET | `/logs?date=2026-09-05` | 某天全部记录 |
| PATCH | `/logs/:id` | 改克数 |
| DELETE | `/logs/:id` | 删除 |
| GET | `/summary?date=` | 当日热量与碳蛋脂合计（按餐次分组） |

> Token 方案：access token（15min）放内存，refresh token（7d）Web 端放 httpOnly Cookie、RN 端放 SecureStore。

---

## 6. 内置食物数据集规范

**收录原则**：宁精不滥。150~250 条覆盖你 90% 的日常记录，其余靠自定义。

### 分类（9 类，实际收录 232 条）

| code | 分类 | 条数 |
|---|---|---|
| `vegetable` | 蔬菜菌菇 | 37 |
| `meat` | 肉禽蛋 | 31 |
| `staple` | 主食谷薯 | 30 |
| `dish` | 成品菜（含外卖汉堡/薯条） | 28 |
| `drink` | 饮品（含外卖咖啡奶茶） | 26 |
| `fruit` | 水果 | 24 |
| `bean` | 水产豆制品 | 24 |
| `snack` | 坚果零食 | 20 |
| `dairy` | 奶制品 | 12 |

> 搜索支持中文名称、别名、拼音首字母（`gbjd` → 宫保鸡丁）与全拼。
> 拼音字段由 `packages/core/scripts/gen_pinyin.py` 自动生成，新增食物后重跑即可。

### 数据格式
```json
{
  "id": "rice-steamed",
  "name": "米饭（蒸）",
  "aliases": ["白米饭", "大米饭"],
  "category": "staple",
  "per100g": { "kcal": 116, "carbs": 25.9, "protein": 2.6, "fat": 0.3 },
  "servings": [
    { "label": "一小碗", "grams": 150 },
    { "label": "一碗", "grams": 200, "isDefault": true }
  ],
  "source": "中国食物成分表（第6版）"
}
```

### 数据来源与声明
- 基础食材：**《中国食物成分表》** 公开数据
- 外卖/包装食品：**品牌官网公示的营养信息**（肯德基、麦当劳、瑞幸、喜茶、星巴克等）
- 每条数据标注 `source`，App 内设置页放免责声明：数据仅供参考，不构成医疗建议

---

## 7. UI / UX 规范

### 响应式断点（Web）
| 宽度 | 布局 |
|---|---|
| < 768px | 单栏：日期切换 + 餐次列表 + 汇总（手机） |
| 768–1199px | 双栏：左侧记录区 / 右侧当日汇总（平板） |
| ≥ 1200px | 三栏：左侧日期+餐次导航 / 中间搜索与记录 / 右侧汇总（电脑） |

### 主题
- 三种模式：**亮色 / 暗色 / 跟随系统**
- 存本地（Web localStorage、RN AsyncStorage），读取优先于系统设置
- 切换时颜色过渡动画

### 动画清单（适度）
- 路由/页面转场淡入位移
- 食物列表项 stagger 进场
- 当日热量数字滚动
- 碳蛋脂进度条/环形图填充
- 按钮按压 scale 反馈
- 添加成功的 toast + 微动效
- 主题切换过渡

> Web 用 Framer Motion，RN 用 Reanimated 3 —— 两套实现，但都是上面这 7 个效果，不会失控。

---

## 8. 开发计划

| 阶段 | 内容 | 产出 |
|---|---|---|
| **P0** | Monorepo 初始化、TS/lint 配置、路径别名 | 空壳能跑 |
| **P1** | core：类型 + 营养计算 + 搜索匹配 + **整理 150~250 条食物 JSON** | 纯 TS，可单测 |
| **P2** | api：Prisma + Neon 连接 + 鉴权 + foods/logs/summary | Postman 能跑通全流程 |
| **P3** | web：登录 + 记录主界面 + 三端响应式 + 主题 + 动画 | **第一个可用版本** |
| **P4** | mobile：Expo RN 复用 core，导航 + 记录界面 + 动画 | 安卓可用 |
| **P5** | 部署：Render（API + 静态站）+ Neon + 安卓 APK | 小伙伴能用上 |

**建议**：P0–P3 做完就已经能在电脑和手机浏览器上用了。P4 的安卓端是锦上添花，可以放到最后——毕竟 RN 调试比浏览器慢得多。

---

## 9. 部署

- **API** → Render Web Service（免费版：15 分钟休眠、冷启动 30~60s、750 实例小时/月）
- **Web** → Render Static Site（免费，不休眠）
- **DB** → Neon 免费 Postgres（0.5GB，闲置休眠但**不会删数据**）
- **安卓** → 用 `expo build` / EAS 出 APK，直接发给伙伴安装，无需上架

⚠️ 已知代价：Render 免费版国内访问偏慢、首次请求要等冷启动。能接受就先跑，受不了再迁国内服务器（Prisma 换个 `DATABASE_URL` 即可，代码不用改）。

---

## 10. 我替你定的假设（不同意就说）

1. 营养展示精度：热量取整 kcal，碳蛋脂保留 1 位小数
2. 记录不分餐次，某天记录按添加时间平铺展示
3. 一个用户可以一天记多条同一食物（不做合并）
4. 语言：简体中文，暂无国际化
5. 时区：按用户本地日期切分"今天"
6. 不写单元测试覆盖 UI，但 **core 的营养计算必须有单测**（算错就是产品事故）

## 11. 待定（不阻塞开工）

- 项目中文名（暂用 HealthPlan，备选：轻卡 / 卡记 / 每日营养）
- 图标与配色主色（建议先用绿色系，与健康饮食调性匹配）
- 是否需要"常用食物"置顶（我倾向做，成本很低）
