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

export function getLanguage(name: string) {
  return (
    languagePatterns.find((p) => isMatch(name, p.pattern))?.language ??
    "plaintext"
  );
}
