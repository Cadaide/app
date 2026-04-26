import { Module } from '@nestjs/common';
import { WindowController } from './window.controller';
import { WindowService } from './window.service';
import { WindowGateway } from './window.gateway';
import { PluginService } from '../plugin/plugin.service';

@Module({
  imports: [],
  controllers: [WindowController],
  providers: [WindowService, WindowGateway, PluginService],
})
export class WindowModule {}
