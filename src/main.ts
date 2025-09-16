import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

dotenv.config(); // .env dosyasını erkenden yükle

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CLIENT_URL?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  await app.listen(process.env.PORT ?? 5000);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 5000}`);
}
bootstrap();
