import { Language } from 'src/types/Language';
import { PythonLanguageConfig } from './languages/python';
import { TypeScriptLanguageConfig } from './languages/typescript';

export interface ILanguageConfig {
  lsp: {
    command: string[];
  };
}

export const LanguageConfig: {
  [key in Language]: ILanguageConfig;
} = {
  python: PythonLanguageConfig,
  typescript: TypeScriptLanguageConfig,
};
