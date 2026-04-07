import z from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const SettingsSchema = z.object({
  editor: z.object({
    fontSize: z.number().default(18),
  }),
});

export const defaultSettings: z.infer<typeof SettingsSchema> & {
  $schema: string;
} = {
  $schema: './settings.schema.json',
  editor: {
    fontSize: 18,
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
