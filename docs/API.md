# HealthPlan 后端 API

技术栈：NestJS 10 + Prisma 5 + PostgreSQL（Neon 免费版）。代码在 `apps/api/`。

## 运行步骤

```bash
# 1. 安装依赖（根目录）
pnpm install

# 2. 准备环境变量
cp apps/api/.env.example apps/api/.env
#   编辑 .env，填入 DATABASE_URL（Neon 连接串）、JWT_SECRET、CORS_ORIGIN

# 3. 生成 Prisma 客户端 + 建表
pnpm -F @healthplan/api prisma:generate
#   有数据库时执行迁移：
pnpm -F @healthplan/api prisma:migrate
#   没有数据库时，可直接拿 apps/api/prisma/migrations/0001_init/migration.sql 在库里执行

# 4. 启动
pnpm -F @healthplan/api start:dev      # 开发（监听）
pnpm -F @healthplan/api start:prod     # 生产（node dist/main.js）
```

> 注意：pnpm 默认拦截依赖的 build 脚本（allowBuilds 白名单已放行 esbuild/prisma/@nestjs/core 等），Prisma 客户端由 postinstall 自动生成；若换机器后类型报错，手动跑一次 `prisma:generate`。

## 认证

除 `GET /foods/builtin` 外，所有接口需在 Header 带 `Authorization: Bearer <token>`。

### POST /auth/register

```json
{ "email": "a@b.com", "username": "laodan", "password": "123456" }
```
返回：`{ "token": "...", "user": { "id", "email", "username" } }`

### POST /auth/login

```json
{ "account": "laodan 或 a@b.com", "password": "123456" }
```
返回：同上。

### GET /auth/me

返回当前登录用户信息（需 token）。

## 食物

`GET /foods/builtin` —— 系统内置 232 条，无需登录。

`GET /foods/search?q=米饭&category=fruit` —— 合并「系统库 + 我的自定义」按评分排序；支持中文名、别名、拼音首字母（如 `gbjd`）、全拼。需 token。

`GET /foods/me` —— 我的自定义食物列表。

`POST /foods` —— 新增自定义食物（body 见下）。

`GET /foods/me/:id` / `PATCH /foods/me/:id` / `DELETE /foods/me/:id` —— 自定义食物查/改/删（仅本人）。

`GET /foods/:id` —— 解析任意食物（记日志前调用）。

### 自定义食物 body（POST /foods）

```json
{
  "name": "外婆红烧肉",
  "aliases": ["红烧肉"],
  "category": "dish",
  "per100g": { "kcal": 340, "carbs": 5, "protein": 12, "fat": 30 },
  "servings": [{ "label": "一份", "grams": 150, "isDefault": true }],
  "origin": "自制"
}
```

`category` 取值：`staple` `meat` `bean` `vegetable` `fruit` `dairy` `drink` `snack` `dish`。

## 记录

所有记录接口需 token，且只能操作本人数据。

### POST /logs

```json
{ "foodId": "staple-rice-steamed", "date": "2026-09-05", "grams": 200 }
```
`foodId` 可为系统食物 id 或本人自定义食物 id。记录**不分餐次**，某天所有记录平铺展示。

### GET /logs?date=2026-09-05

当日某天的全部记录。

### GET /logs/range?from=2026-09-01&to=2026-09-30

日期范围内记录。

### GET /logs/summary?date=2026-09-05

当日汇总：

```json
{
  "date": "2026-09-05",
  "total": { "kcal": 1820, "carbs": 210, "protein": 80, "fat": 60 },
  "share": { "carbs": 50, "protein": 20, "fat": 30 }
}
```

`share` 为三大营养素**供能占比**（4/4/9 kcal 换算），不依赖目标值。

### PATCH /logs/:id / DELETE /logs/:id

改 / 删某条记录（仅本人）。

## 设计要点

- **营养值快照**：每条记录落库时即算好 `nutrition` 并存储，历史不可变（改了食物数据不影响过去的记录）。
- **日期用 `YYYY-MM-DD` 字符串**，规避时区错乱。
- **系统食物不进库**，直接来自 `@healthplan/core` 的 `BUILTIN_FOODS`，保证与前端/安卓端数据同源。
- 密码用 `bcryptjs` 加盐哈希，JWT 有效期 30 天。
