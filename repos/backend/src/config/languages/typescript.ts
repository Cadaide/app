import { ILanguageConfig } from '../languages';

export const TypeScriptLanguageConfig: ILanguageConfig = {
  lsp: {
    command: [
      process.env.BUN_BINARY_PATH ?? 'bun',
      'x',
      '--yes',
      '-p',
      '@vtsls/language-server',
      'vtsls',
      '--stdio',
    ],
  },
};
