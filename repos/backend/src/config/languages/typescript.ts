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
  fileTemplates: [
    {
      id: 'class',
      name: 'Class',
      icon: 'lucide:class',
      filename: '{{name}}.ts',
      content: 'export class {{name}} {\n  constructor() {}\n}\n',
    },
  ],
};
