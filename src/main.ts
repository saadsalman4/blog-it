import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation with whitelist and forbidNonWhitelisted
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Use the custom validation exception filter globally
  app.useGlobalFilters(new ValidationExceptionFilter());

  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept', // Custom headers allowed
    credentials: true, // Allow credentials (optional if needed)
  });

  await app.listen(3000);
}
bootstrap();
