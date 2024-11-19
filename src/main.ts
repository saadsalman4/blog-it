import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up Swagger options
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()  // Add security if your API uses JWT
    .build();

  // Create the Swagger document
  const document = SwaggerModule.createDocument(app, config);

  // Serve the Swagger documentation at `/api-docs`
  SwaggerModule.setup('api-docs', app, document);

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
