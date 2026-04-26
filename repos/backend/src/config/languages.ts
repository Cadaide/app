import { Language } from 'src/types/Language';
import { PythonLanguageConfig } from './languages/python';
import { TypeScriptLanguageConfig } from './languages/typescript';

export interface ILanguageFileTemplateFormElement {
  id: string;
  label: string;
  placeholder: string;
}

export interface ILanguageFileTemplate {
  id: string;
  name: string;
  icon: string;
  content: string;
  filename: string;
  formElements?: ILanguageFileTemplateFormElement[];
}

export interface ILanguageFileTemplateGroup {
  id: string;
  name: string;
  entries: ILanguageFileTemplate[];
}

export interface ILanguageConfig {
  lsp: {
    command: string[];
  };
  fileTemplates: ILanguageFileTemplateGroup[];
  identityFiles: string[];
  sourcePatterns: string[];
}

export const LanguageConfig: {
  [key in Language]: ILanguageConfig;
} = {
  python: PythonLanguageConfig,
  typescript: TypeScriptLanguageConfig,
};
