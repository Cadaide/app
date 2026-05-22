import z from 'zod';

const SettingsSchema = z.object({
  editor: z.object({
    fontSize: z.number().default(18),
  }),
  terminal: z.object({
    shell: z
      .string()
      .default(process.platform === 'win32' ? 'powershell.exe' : 'bash'),
  }),
  packageManager: z.object({
    provider: z.record(z.string(), z.string()),
  }),
});

export const defaultSettings: z.infer<typeof SettingsSchema> & {
  $schema: string;
} = {
  $schema: './settings.schema.json',
  editor: {
    fontSize: 18,
  },
  terminal: {
    shell: process.platform === 'win32' ? 'powershell.exe' : 'bash',
  },
  packageManager: {
    provider: {},
  },
};

export const settingsSchema = {
  ...SettingsSchema.toJSONSchema(),
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  properties: {
    $schema: { type: 'string' as const },
    ...(SettingsSchema.toJSONSchema() as Record<string, any>).properties,
  },
};
