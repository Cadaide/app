import { readFileSync } from 'fs';
import path from 'path';

export const Appmeta = {
  version: JSON.parse(
    readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'),
  ).version,
};
