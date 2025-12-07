import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // CORS configuration: use CORS_ORIGINS env var or allow all origins for LAN access
    const corsOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : true; // Allow all origins when not configured (for LAN access)

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0'); // Listen on all interfaces for LAN access
    console.log(`Application is running on port: ${port}`);
}
bootstrap();
