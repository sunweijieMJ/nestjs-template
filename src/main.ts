import 'dotenv/config';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import validationOptions from './common/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './common/serializer.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { MetricsInterceptor } from './infrastructure/metrics/metrics.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Pino logger
  app.useLogger(app.get(Logger));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  // CORS configuration
  const frontendDomain = configService.get('app.frontendDomain', { infer: true });
  const nodeEnv = configService.get('app.nodeEnv', { infer: true });

  if (nodeEnv === 'production' && frontendDomain) {
    // Production: only allow configured frontend domain(s)
    const allowedOrigins = frontendDomain.split(',').map((origin) => origin.trim());
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        configService.getOrThrow('app.headerLanguage', { infer: true }),
      ],
    });
  } else {
    // Development: allow all origins for easier testing
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Global exception filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.getOrThrow('app.apiPrefix', { infer: true }), {
    exclude: ['/', 'metrics'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  // Metrics interceptor (if enabled)
  const metricsEnabled = configService.get('metrics.enabled', { infer: true });
  const reflector = app.get(Reflector);
  const interceptors = [
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(reflector), // Wrap responses in unified format
  ];

  if (metricsEnabled) {
    try {
      const metricsInterceptor = app.get(MetricsInterceptor);
      interceptors.push(metricsInterceptor);
    } catch {
      // MetricsInterceptor not available, skip
    }
  }

  app.useGlobalInterceptors(...interceptors);

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription(
      'API docs\n\n' +
        '📄 **OpenAPI JSON**: [/docs-json](/docs-json)\n\n' +
        '📥 **Download**: [openapi.json](/docs-json)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: configService.getOrThrow('app.headerLanguage', { infer: true }),
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
