import { isMatch } from "matcher";

const languagePatterns = [
  {
    pattern: "*.ts",
    language: "typescript",
  },
  {
    pattern: "*.py",
    language: "python",
  },
  {
    pattern: "*.json",
    language: "json",
  },
  {
    pattern: "*.sh",
    language: "shell",
  },
];

const languageNames = {
  typescript: "TypeScript",
  python: "Python",
  json: "JSON",
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

export function getLanguageName(id: string) {
  return languageNames[id as keyof typeof languageNames] ?? id;
}
