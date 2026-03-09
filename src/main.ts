import * as dotenv from 'dotenv';
import path from 'path';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY eksik; destek yanıtları devre dışı kalacak.');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'https://home.aishe.pro',
      'https://app.aishe.pro',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT) || 3002;
  await app.listen(port);
}

bootstrap();
