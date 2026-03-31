import { TIconpack } from "../../icons";

export const CatppuccinIcons: TIconpack = [
  // Nest.JS
  {
    pattern: "nest-cli.json",
    icon: "catppuccin:nest",
  },
  {
    pattern: "*.module.ts",
    icon: "catppuccin:nest",
  },
  {
    pattern: "*.service.ts",
    icon: "catppuccin:nest-service",
  },
  {
    pattern: "*.controller.ts",
    icon: "catppuccin:nest-controller",
  },
  // Node.JS
  {
    pattern: "package.json",
    icon: "catppuccin:package-json",
  },
  // TypeScript
  {
    pattern: ["tsconfig.json", "tsconfig.*.json"],
    icon: "catppuccin:typescript-config",
  },
  {
    pattern: "*.ts",
    icon: "catppuccin:typescript",
  },
  // Eslint
  {
    pattern: "eslint.config.mjs",
    icon: "catppuccin:eslint",
  },
  // Bun
  {
    pattern: ["bun.lock", "bun.lockb"],
    icon: "catppuccin:bun-lock",
  },
  // Prettier
  {
    pattern: ".prettierrc",
    icon: "catppuccin:prettier",
  },
  // Git
  {
    pattern: ".gitignore",
    icon: "catppuccin:git",
  },
  // Json
  {
    pattern: "*.json",
    icon: "catppuccin:json",
  },
];

export const CatppuccinFolderIcons: TIconpack = [
  {
    pattern: "src",
    icon: "catppuccin:folder-src",
  },
  {
    pattern: "api",
    icon: "catppuccin:folder-api",
  },
  {
    pattern: "assets",
    icon: "catppuccin:folder-assets",
  },
  {
    pattern: "utils",
    icon: "catppuccin:folder-utils",
  },
  {
    pattern: "types",
    icon: "catppuccin:folder-types",
  },
  {
    pattern: "node_modules",
    icon: "catppuccin:folder-node",
  },
  {
    pattern: "dist",
    icon: "catppuccin:folder-dist",
  },
  {
    pattern: ["test", "tests"],
    icon: "catppuccin:folder-tests",
  },
  {
    pattern: "routes",
    icon: "catppuccin:folder-routes",
  },
];
