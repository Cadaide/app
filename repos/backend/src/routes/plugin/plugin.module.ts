import { Module } from '@nestjs/common';
import { PluginController } from './plugin.controller';
import { PluginService } from './plugin.service';
import { PluginGateway } from './plugin.gateway';
import { PluginLibService } from './lib/lib.service';
import { SettingsService } from 'src/services/settings.service';

@Module({
  imports: [],
  controllers: [PluginController],
  providers: [PluginService, PluginGateway, PluginLibService, SettingsService],
})
export class PluginModule {}
