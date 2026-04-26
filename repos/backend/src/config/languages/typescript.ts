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
      id: 'basic',
      name: 'Basic',
      entries: [
        {
          id: 'blank',
          name: 'Blank file',
          icon: 'codicon:file',
          filename: '{{name}}.ts',
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
          filename: '{{name}}.ts',
          content: 'export class {{name}} {\n\tconstructor() {}\n}\n',
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
    {
      id: 'react',
      name: 'React',
      entries: [
        {
          id: 'component',
          name: 'Component',
          icon: 'catppuccin:typescript-react',
          filename: '{{name}}.tsx',
          content:
            'export interface I{{name:pascal}}Props {}\n\nexport function {{name:pascal}}(props: I{{name:pascal}}Props) {\n\treturn (\n\t\t<></>\n\t)\n}',
          formElements: [
            {
              id: 'name',
              label: 'Component name',
              placeholder: 'MyComponent',
            },
          ],
        },
      ],
    },
  ],
};
