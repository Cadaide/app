import { Language } from 'src/types/Language';
import { PythonLanguageConfig } from './languages/python';
import { TypeScriptLanguageConfig } from './languages/typescript';

export interface ILanguageFileTemplate {
  id: string;
  name: string;
  icon: string;
  content: string;
  filename: string;
}

export interface ILanguageConfig {
  lsp: {
    command: string[];
  };
  fileTemplates: ILanguageFileTemplate[];
}

export const LanguageConfig: {
  [key in Language]: ILanguageConfig;
} = {
  python: PythonLanguageConfig,
  typescript: TypeScriptLanguageConfig,
};
