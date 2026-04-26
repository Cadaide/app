import {
  camelCase,
  constantCase,
  kebabCase,
  pascalCase,
  snakeCase,
} from "change-case";

export function fillTemplate(content: string, values: Record<string, string>) {
  let formatted = content;

  for (const [key, value] of Object.entries(values)) {
    const pascal = pascalCase(value);
    const camel = camelCase(value);
    const snake = snakeCase(value);
    const lower = value.toLowerCase();
    const kebab = kebabCase(value);
    const upper = value.toUpperCase();
    const scream = constantCase(value);

    formatted = formatted.replaceAll(`{{${key}}}`, value);
    formatted = formatted.replaceAll(`{{${key}:pascal}}`, pascal);
    formatted = formatted.replaceAll(`{{${key}:kebab}}`, kebab);
    formatted = formatted.replaceAll(`{{${key}:lower}}`, lower);
    formatted = formatted.replaceAll(`{{${key}:camel}}`, camel);
    formatted = formatted.replaceAll(`{{${key}:snake}}`, snake);
    formatted = formatted.replaceAll(`{{${key}:upper}}`, upper);
    formatted = formatted.replaceAll(`{{${key}:scream}}`, scream);
  }

  return formatted;
}
