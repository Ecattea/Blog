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

export interface CodeLanguagePickerOption {
  id: string;
  label: string;
}

const CODE_LANGUAGE_PICKER_OPTIONS: CodeLanguagePickerOption[] = [
  { id: "plaintext", label: "Plain text" },
  { id: "typescript", label: "TypeScript" },
  { id: "tsx", label: "TSX" },
  { id: "javascript", label: "JavaScript" },
  { id: "jsx", label: "JSX" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "bash", label: "Bash" },
  { id: "shell", label: "Shell" },
  { id: "json", label: "JSON" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "yaml", label: "YAML" },
  { id: "xml", label: "XML" },
  { id: "sql", label: "SQL" },
  { id: "markdown", label: "Markdown" },
  { id: "php", label: "PHP" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "ruby", label: "Ruby" },
  { id: "kotlin", label: "Kotlin" },
  { id: "swift", label: "Swift" },
  { id: "c", label: "C" },
  { id: "csharp", label: "C#" },
  { id: "dockerfile", label: "Dockerfile" },
  { id: "diff", label: "Diff" },
];

const CODE_LANGUAGE_PICKER_LABELS = Object.fromEntries(
  CODE_LANGUAGE_PICKER_OPTIONS.map(option => [option.id, option.label])
) as Record<string, string>;

export const codeLanguagePickerOptions = CODE_LANGUAGE_PICKER_OPTIONS;

export const resolveCodeLanguageId = (rawLanguage: string) => {
  const normalized = normalizeCodeLanguage(rawLanguage);
  if (!normalized) return "";

  return CODE_LANGUAGE_SHIKI_ALIASES[normalized] ?? normalized;
};

export const resolveCodeLanguagePickerId = (rawLanguage: string) => {
  const normalized = normalizeCodeLanguage(rawLanguage);
  if (!normalized) return "plaintext";

  if (normalized === "sh" || normalized === "shell" || normalized === "zsh") {
    return "shell";
  }

  const resolvedLanguageId = resolveCodeLanguageId(normalized);
  return (
    (CODE_LANGUAGE_PICKER_LABELS[normalized] && normalized) ||
    (CODE_LANGUAGE_PICKER_LABELS[resolvedLanguageId] && resolvedLanguageId) ||
    "plaintext"
  );
};

export const getCodeLanguagePickerLabel = (languageId: string) =>
  CODE_LANGUAGE_PICKER_LABELS[languageId] ?? formatCodeLanguageLabel(languageId);

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
