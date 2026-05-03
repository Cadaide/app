import { apiAdapter } from ".";

export const ShellAPI = {
  run: async (
    command: string[],
    options?: Partial<{
      cwd: string;
    }>,
  ): Promise<string> => {
    const response = await apiAdapter().post(`/shell`, { command, options });

    return response.data;
  },
};
