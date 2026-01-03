import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import loggerConfig from './logger/config/logger.config';
import redisConfig from './redis/config/redis.config';
import throttlerConfig from './throttler/config/throttler.config';
import metricsConfig from './metrics/config/metrics.config';
import smsConfig from './sms/config/sms.config';
import wechatConfig from './wechat/config/wechat.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './database/mongoose-config.service';
import { DatabaseConfig } from './database/config/database-config.type';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { ThrottlerModule } from './throttler/throttler.module';
import { MetricsModule } from './metrics/metrics.module';
import { SmsModule } from './sms/sms.module';
import { AddressesModule } from './addresses/addresses.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TransactionModule } from './database/transaction/transaction.module';
import { AuditModule } from './audit/audit.module';

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
