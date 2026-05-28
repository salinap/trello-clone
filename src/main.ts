import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trello Clone API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerApp: unknown = app;
  const swaggerDocument = SwaggerModule.createDocument(
    swaggerApp as Parameters<typeof SwaggerModule.createDocument>[0],
    swaggerConfig,
  );
  SwaggerModule.setup(
    'docs',
    swaggerApp as Parameters<typeof SwaggerModule.setup>[1],
    swaggerDocument,
  );

  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);
  const env = config.get<string>('app.env');
  const port = config.get<number>('app.port');
  await app.listen(port ?? 4000);

  logger.log(`App running on port ${port}`);
  if (env === 'development') {
    logger.log(
      `DB: ${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`,
    );
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
