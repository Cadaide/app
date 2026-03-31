import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import path from 'path';
import fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const socketPath =
    process.env.SOCKET_PATH || path.join(process.cwd(), 'backend.sock');

  // 1. Zajištění existence složky
  const socketDir = path.dirname(socketPath);
  if (!fs.existsSync(socketDir)) {
    fs.mkdirSync(socketDir, { recursive: true });
  }

  // 2. ÚKLID: Smazání starého socketu, pokud existuje (Zabrání EADDRINUSE)
  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  // 3. Spuštění aplikace na Unix Socketu (místo portu)
  await app.listen(socketPath);
  console.log(`🚀 NestJS úspěšně naslouchá na socketu: ${socketPath}`);

  // 4. (Volitelné, ale doporučené) Nastavení práv k souboru
  // Zaručí, že váš Electron proces (Next.js) bude moci do socketu zapisovat a číst z něj.
  // 0666 znamená čtení a zápis pro všechny (v kontextu lokálního PC bezpečné).
  fs.chmodSync(socketPath, '0666');
}

bootstrap();
