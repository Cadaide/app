import { Module } from '@nestjs/common';
import { PluginController } from './plugin.controller';
import { PluginService } from './plugin.service';
import { PluginGateway } from './plugin.gateway';

@Module({
  imports: [],
  controllers: [PluginController],
  providers: [PluginService, PluginGateway],
})
export class PluginModule {}
