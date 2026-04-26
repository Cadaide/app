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
          id: 'blank',
          name: 'Blank file',
          icon: 'codicon:file',
          filename: '{{name}}.py',
          content: '',
          formElements: [
            {
              id: 'name',
              label: 'Name',
              placeholder: 'myFile',
            },
          ],
        },
        {
          id: 'class',
          name: 'Class',
          icon: 'codicon:symbol-class',
          filename: '{{name}}.py',
          content: 'class {{name:pascal}}:\n  def __init__(self):\n    pass\n',
          formElements: [
            {
              id: 'name',
              label: 'Class name',
              placeholder: 'MyClass',
            },
          ],
        },
      ],
    },
  ],
  identityFiles: ['pyproject.toml', 'requirements.txt'],
  sourcePatterns: ['*.py'],
};
