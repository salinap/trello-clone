import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

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
