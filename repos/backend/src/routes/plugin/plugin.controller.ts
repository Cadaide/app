import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PluginService } from './plugin.service';

@Controller('/plugin')
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Get('list')
  async listPlugins() {
    return this.pluginService.listPlugins();
  }

  @Get('list/installed')
  async listInstalledPlugins() {
    return this.pluginService.listInstalled();
  }

  @Get(':id')
  async getPlugin(@Param('id') id: string) {
    return this.pluginService.getPlugin(id);
  }

  @Post(':id/install')
  async installPlugin(@Param('id') id: string) {
    return this.pluginService.installPlugin(id);
  }

  @Post('install/folder')
  async installPluginFromFolder(@Query('path') path: string) {
    return this.pluginService.installFromFolder(path);
  }

  @Delete(':id/uninstall')
  async uninstallPlugin(@Param('id') id: string) {
    return this.pluginService.removePlugin(id);
  }
}
