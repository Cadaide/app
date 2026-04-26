import { apiAdapter } from ".";

export const ProjectAPI = {
  detectLanguage: async (path: string): Promise<{ language: string }> => {
    const response = await apiAdapter.get(`/project/language?path=${path}`);

    return response.data;
  },
};
