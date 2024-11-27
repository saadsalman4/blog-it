import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation with whitelist and forbidNonWhitelisted
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Use the custom validation exception filter globally
  app.useGlobalFilters(new ValidationExceptionFilter());

  const port = process.env.PORT || 8080;
  

  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept', // Custom headers allowed
    credentials: true, // Allow credentials (optional if needed)
  });

  await app.listen(port);
}
bootstrap();
