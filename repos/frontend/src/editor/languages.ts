import { isMatch } from "matcher";

const languagePatterns = [
  {
    pattern: "*.tsx",
    language: "typescript",
    displayLanguage: "typescriptreact",
  },
  {
    pattern: "*.ts",
    language: "typescript",
    displayLanguage: "typescript",
  },
  {
    pattern: "*.jsx",
    language: "javascript",
    displayLanguage: "javascriptreact",
  },
  {
    pattern: "*.js",
    language: "javascript",
    displayLanguage: "javascript",
  },
  {
    pattern: "*.py",
    language: "python",
    displayLanguage: "python",
  },
  {
    pattern: "*.json",
    language: "json",
    displayLanguage: "json",
  },
  {
    pattern: "*.css",
    language: "css",
    displayLanguage: "css",
  },
  {
    pattern: "*.html",
    language: "html",
    displayLanguage: "html",
  },
  {
    pattern: "*.md",
    language: "markdown",
    displayLanguage: "markdown",
  },
  {
    pattern: "*.sh",
    language: "shell",
    displayLanguage: "shell",
  },
];

const languageNames: Record<string, string> = {
  typescript: "TypeScript",
  typescriptreact: "TypeScript React",
  javascript: "JavaScript",
  javascriptreact: "JavaScript React",
  python: "Python",
  json: "JSON",
  css: "CSS",
  html: "HTML",
  markdown: "Markdown",
  shell: "Shell",
  plaintext: "Plain Text",
};

export function getLanguage(name: string) {
  if (!name) return "plaintext";

  return (
    languagePatterns.find((p) => isMatch(name, p.pattern))?.language ??
    "plaintext"
  );
}

export function getDisplayLanguage(name: string) {
  if (!name) return "plaintext";

  return (
    languagePatterns.find((p) => isMatch(name, p.pattern))?.displayLanguage ??
    "plaintext"
  );
}

export function getLanguageName(id: string) {
  return languageNames[id] ?? id;
}
