import { Module } from '@nestjs/common';
import { FilesystemModule } from './routes/filesystem/filesystem.module';
import { LspModule } from './routes/lsp/lsp.module';
import { ConfigModule } from './routes/config/config.module';
import { HealthModule } from './routes/health/health.module';

@Module({
  imports: [ConfigModule, HealthModule, FilesystemModule, LspModule],
})
export class AppModule {}
