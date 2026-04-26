import { apiAdapter } from ".";

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
}

export const LanguageAPI = {
  getConfig: async (id: string): Promise<ILanguageConfig | null> => {
    const response = await apiAdapter.get(`/language/${id}/config`);

    return response.data ?? null;
  },
};
