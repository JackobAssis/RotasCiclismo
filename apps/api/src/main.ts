import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { loadConfig } from './config/config';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const config = loadConfig();

  logger.log(`Environment: ${config.node_env}`);
  logger.log(`API Prefix: /api`);
  logger.log(`CORS Origins: ${config.cors_origin}`);

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.cors_origin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(config.port);
  logger.log(`Server running on port ${config.port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
