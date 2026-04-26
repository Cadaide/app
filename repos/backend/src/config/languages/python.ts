import { ILanguageConfig } from '../languages';

export const PythonLanguageConfig: ILanguageConfig = {
  lsp: {
    command: [
      process.env.BUN_BINARY_PATH ?? 'bun',
      'x',
      '--yes',
      '-p',
      'pyright',
      'pyright-langserver',
      '--stdio',
    ],
  },
  fileTemplates: [
    {
      id: 'basic',
      name: 'Basic',
      entries: [
        {
          id: 'class',
          name: 'Class',
          icon: 'lucide:class',
          filename: '{{name}}.py',
          content: 'class {{name}}:\n  def __init__(self):\n    pass\n',
        },
      ],
    },
  ],
};
