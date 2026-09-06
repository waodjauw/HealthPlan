import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)
  const corsOrigin = config.get<string>('CORS_ORIGIN')
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((item) => item.trim()) : true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  const port = config.get<number>('PORT') ?? 3000
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`HealthPlan API listening on http://localhost:${port}`)
}

bootstrap()
