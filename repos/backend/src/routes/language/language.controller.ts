import { Controller, Get, Param } from '@nestjs/common';
import { LanguageService } from './language.service';

@Controller('/language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get('/:id/config')
  async getConfig(@Param('id') id: string) {
    return this.languageService.getConfig(id);
  }
}
