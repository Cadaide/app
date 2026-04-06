import { apiAdapter } from ".";

export const ConfigAPI = {
  getSettings: async () => {
    const response = await apiAdapter.get(`/config/settings`);

    return response.data;
  },
  getSettingsPath: async () => {
    const response = await apiAdapter.get(`/config/settings/path`);

    return response.data;
  },
};
