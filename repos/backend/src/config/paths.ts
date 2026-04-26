import path from 'path';

export const CFG_PATH_CONFIG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  process.env.NODE_ENV == 'development' ? '.cadaide-dev' : '.cadaide',
);

export const CFG_PATH_SETTINGS_FILE = path.join(
  CFG_PATH_CONFIG_DIR,
  'settings.json',
);

export const CFG_PATH_PLUGINS_DIR = path.join(CFG_PATH_CONFIG_DIR, 'plugins');
