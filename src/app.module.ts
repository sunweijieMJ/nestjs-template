import { Module } from '@nestjs/common';
import { UsersModule } from './core/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { AuthModule } from './core/auth/auth.module';
import databaseConfig from './infrastructure/database/config/database.config';
import authConfig from './core/auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './integrations/mail/config/mail.config';
import fileConfig from './modules/files/config/file.config';
import loggerConfig from './infrastructure/logger/config/logger.config';
import redisConfig from './infrastructure/redis/config/redis.config';
import throttlerConfig from './infrastructure/throttler/config/throttler.config';
import metricsConfig from './infrastructure/metrics/config/metrics.config';
import smsConfig from './integrations/sms/config/sms.config';
import wechatConfig from './integrations/wechat/config/wechat.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './infrastructure/database/typeorm-config.service';
import { MailModule } from './integrations/mail/mail.module';
import { HomeModule } from './modules/home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './core/session/session.module';
import { MailerModule } from './integrations/mail/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './infrastructure/database/mongoose-config.service';
import { DatabaseConfig } from './infrastructure/database/config/database-config.type';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { CacheModule } from './infrastructure/cache/cache.module';
import { HealthModule } from './infrastructure/health/health.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { ThrottlerModule } from './infrastructure/throttler/throttler.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { SmsModule } from './integrations/sms/sms.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { PermissionsModule } from './core/permissions/permissions.module';
import { TransactionModule } from './infrastructure/database/transaction/transaction.module';
import { AuditModule } from './infrastructure/audit/audit.module';

// <database-block>
const infrastructureDatabaseModule = (databaseConfig() as DatabaseConfig).isDocumentDatabase
  ? MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    })
  : TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options?: DataSourceOptions) => {
        if (!options) {
          throw new Error('DataSourceOptions is required');
        }
        return new DataSource(options).initialize();
      },
    });
// </database-block>

// Modules that only work with relational databases (TypeORM)
const isDocumentDatabase = (databaseConfig() as DatabaseConfig).isDocumentDatabase;
const relationalOnlyModules = isDocumentDatabase ? [] : [TransactionModule, AuditModule];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        loggerConfig,
        redisConfig,
        throttlerConfig,
        metricsConfig,
        smsConfig,
        wechatConfig,
      ],
      envFilePath: ['.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const logLevel = configService.get('logger.level', { infer: true });
        const prettyPrint = configService.get('logger.prettyPrint', {
          infer: true,
        });

        return {
          pinoHttp: {
            level: logLevel,
            transport: prettyPrint
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                }
              : undefined,
            autoLogging: true,
            genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.oldPassword',
                'req.body.newPassword',
              ],
              censor: '[REDACTED]',
            },
            customProps: () => ({
              context: 'HTTP',
            }),
            customLogLevel: (_req, res, err) => {
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            customSuccessMessage: (req, res) => {
              return `${req.method} ${req.url} ${res.statusCode}`;
            },
            customErrorMessage: (req, res, err) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
            },
          },
        };
      },
    }),
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    CacheModule,
    HealthModule,
    QueueModule,
    ThrottlerModule,
    MetricsModule.forRoot(),
    SmsModule,
    AddressesModule,
    FavoritesModule,
    FeedbacksModule,
    PermissionsModule,
    ...relationalOnlyModules,
  ],
})
export class AppModule {}
