import { Module } from '@nestjs/common';
import { FilesystemModule } from './routes/filesystem/filesystem.module';
import { LspModule } from './routes/lsp/lsp.module';

@Module({
  imports: [FilesystemModule, LspModule],
})
export class AppModule {}
