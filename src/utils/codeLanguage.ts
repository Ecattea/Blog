// Keep this alias table intentionally small and focused on the common fence
// spellings we expect authors to use in normal markdown posts.
const CODE_LANGUAGE_SHIKI_ALIASES: Record<string, string> = {
  "c#": "csharp",
  "c++": "cpp",
  cc: "cpp",
  cts: "typescript",
  cjs: "javascript",
  cs: "csharp",
  cxx: "cpp",
  docker: "dockerfile",
  golang: "go",
  htm: "html",
  js: "javascript",
  kt: "kotlin",
  md: "markdown",
  mjs: "javascript",
  mts: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

const CODE_LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  "c#": "C#",
  "c++": "C++",
  cc: "C++",
  cts: "TypeScript",
  cjs: "JavaScript",
  cpp: "C++",
  csharp: "C#",
  cs: "C#",
  css: "CSS",
  cxx: "C++",
  diff: "Diff",
  docker: "Dockerfile",
  dockerfile: "Dockerfile",
  go: "Go",
  golang: "Go",
  htm: "HTML",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  kt: "Kotlin",
  kotlin: "Kotlin",
  markdown: "Markdown",
  md: "Markdown",
  mjs: "JavaScript",
  mts: "TypeScript",
  php: "PHP",
  plaintext: "Plain text",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  rs: "Rust",
  rust: "Rust",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  text: "Plain text",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Shell",
};

const normalizeCodeLanguage = (rawLanguage: string) =>
  rawLanguage.trim().toLowerCase();

export const codeLanguageShikiAliases = CODE_LANGUAGE_SHIKI_ALIASES;

const resolveCodeLanguageId = (rawLanguage: string) => {
  const normalized = normalizeCodeLanguage(rawLanguage);
  if (!normalized) return "";

  return CODE_LANGUAGE_SHIKI_ALIASES[normalized] ?? normalized;
};

export const formatCodeLanguageLabel = (rawLanguage: string) => {
  const normalized = normalizeCodeLanguage(rawLanguage);
  if (!normalized) return "";

  const knownLabel =
    CODE_LANGUAGE_LABELS[normalized] ??
    CODE_LANGUAGE_LABELS[resolveCodeLanguageId(normalized)];

  if (knownLabel) return knownLabel;

  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part =>
      /^[a-z]{1,4}$/.test(part)
        ? part.toUpperCase()
        : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`
    )
    .join(" ");
};
