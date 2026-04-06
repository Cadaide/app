import { Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/settings')
  async getSettings() {
    return await this.configService.getSettings();
  }

  @Get('/settings/path')
  async getSettingsPath() {
    return await this.configService.getSettingsPath();
  }
}
