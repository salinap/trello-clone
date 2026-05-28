import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import { validate } from './config/config.schema';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig],
      validate,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('database.host'),
        port: config.getOrThrow<number>('database.port'),
        database: config.getOrThrow('database.name'),
        username: config.getOrThrow('database.user'),
        password: config.getOrThrow('database.password'),
        synchronize: config.getOrThrow<boolean>('database.synchronize'),
        autoLoadEntities: true,
        logging: config.get('app.env') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
