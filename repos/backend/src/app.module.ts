import { Module } from '@nestjs/common';
import { FilesystemModule } from './routes/filesystem/filesystem.module';
import { LspModule } from './routes/lsp/lsp.module';
import { ConfigModule } from './routes/config/config.module';
import { HealthModule } from './routes/health/health.module';
import { LanguageModule } from './routes/language/language.module';
import { ProjectModule } from './routes/project/project.module';
import { PluginModule } from './routes/plugin/plugin.module';
import { WindowModule } from './routes/window/window.module';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    FilesystemModule,
    LspModule,
    LanguageModule,
    ProjectModule,
    PluginModule,
    WindowModule,
  ],
})
export class AppModule {}
