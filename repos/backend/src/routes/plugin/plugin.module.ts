import { Module } from '@nestjs/common';
import { PluginController } from './plugin.controller';
import { PluginService } from './plugin.service';
import { PluginGateway } from './plugin.gateway';
import { PluginLibService } from './lib/lib.service';

@Module({
  imports: [],
  controllers: [PluginController],
  providers: [PluginService, PluginGateway, PluginLibService],
})
export class PluginModule {}
