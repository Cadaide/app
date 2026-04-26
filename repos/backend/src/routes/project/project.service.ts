import { Inject, Injectable } from '@nestjs/common';
import { FilesystemService } from '../filesystem/filesystem.service';
import { LanguageConfig } from 'src/config/languages';
import matcher from 'matcher';
import { Language } from 'src/types/Language';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(FilesystemService)
    private readonly filesystemService: FilesystemService,
  ) {}

  async detectProjectLanguage(path: string) {
    const rootFiles = await this.filesystemService.treeDir(path, 1);

    // Check root-level identity files
    for (const f of rootFiles.entries) {
      for (const language of Object.keys(LanguageConfig)) {
        const config = LanguageConfig[language as Language];

        if (
          config.identityFiles.some((pattern) =>
            matcher.isMatch(f.name, pattern),
          )
        )
          return { language };
      }
    }

    // Count source pattern matches across the tree
    const files = await this.filesystemService.treeDir(path, 3);
    const scores: Record<string, number> = {};

    for (const f of files.entries) {
      for (const language of Object.keys(LanguageConfig)) {
        const config = LanguageConfig[language as Language];

        if (
          config.sourcePatterns.some((pattern) =>
            matcher.isMatch(f.name, pattern),
          )
        )
          scores[language] = (scores[language] ?? 0) + 1;
      }
    }

    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];

    return { language: best?.[0] ?? 'plain' };
  }
}
