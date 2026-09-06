/* 整应用 DI 启动冒烟：mock Prisma，验证模块装配、装饰器、路由可正常启动 */
process.env.JWT_SECRET = 'smoke-test-secret'

const { Test } = require('@nestjs/testing')
const { AppModule } = require('../dist/app.module')
const { PrismaService } = require('../dist/prisma/prisma.service')

const mockPrisma = {
  onModuleInit: async () => {},
  $connect: async () => {},
  $disconnect: async () => {},
  food: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  user: { findFirst: async () => null, create: async () => ({}) },
  foodLog: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
}

;(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  await app.listen(0)
  const port = app.getHttpServer().address().port

  const res = await fetch(`http://localhost:${port}/foods/builtin`)
  const json = await res.json()
  console.log('GET /foods/builtin =>', res.status, '系统食物条数:', json.length)

  // 未带 token 访问受保护接口应 401
  const guarded = await fetch(`http://localhost:${port}/foods/search?q=米饭`)
  console.log('GET /foods/search (无token) =>', guarded.status, '(期望 401)')

  await app.close()
  console.log('DI BOOTSTRAP OK')
})().catch((e) => {
  console.error('BOOTSTRAP FAILED:', e)
  process.exit(1)
})
