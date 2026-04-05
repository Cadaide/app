import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import path from 'path';
import fs from 'fs';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors('*');

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3001);

  /*const socketPath =
    process.env.SOCKET_PATH || path.join(process.cwd(), 'backend.sock');

  const socketDir = path.dirname(socketPath);

  if (!fs.existsSync(socketDir)) fs.mkdirSync(socketDir, { recursive: true });
  if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);

  await app.listen(socketPath);
  console.log(`Backend running on ${socketPath}`);

  fs.chmodSync(socketPath, '0666');*/
}
bootstrap();
