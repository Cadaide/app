import { Module } from '@nestjs/common';
import { FilesystemModule } from './routes/filesystem/filesystem.module';
import { LspModule } from './routes/lsp/lsp.module';
import { ConfigModule } from './routes/config/config.module';

@Module({
  imports: [ConfigModule, FilesystemModule, LspModule],
})
export class AppModule {}
