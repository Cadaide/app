import { Injectable } from '@nestjs/common';
import { LanguageConfig } from 'src/config/languages';

@Injectable()
export class LanguageService {
  getConfig(id: string) {
    return LanguageConfig[id];
  }
}
