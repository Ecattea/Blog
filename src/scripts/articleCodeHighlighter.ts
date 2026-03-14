import {
  createBundledHighlighter,
  createSingletonShorthands,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const ARTICLE_CODE_THEME = "min-light" as const;

const ARTICLE_CODE_LANGUAGE_LOADERS = {
  bash: () => import("shiki/dist/langs/bash.mjs").then(module => module.default),
  c: () => import("shiki/dist/langs/c.mjs").then(module => module.default),
  csharp: () =>
    import("shiki/dist/langs/csharp.mjs").then(module => module.default),
  css: () => import("shiki/dist/langs/css.mjs").then(module => module.default),
  diff: () => import("shiki/dist/langs/diff.mjs").then(module => module.default),
  dockerfile: () =>
    import("shiki/dist/langs/dockerfile.mjs").then(module => module.default),
  go: () => import("shiki/dist/langs/go.mjs").then(module => module.default),
  html: () => import("shiki/dist/langs/html.mjs").then(module => module.default),
  java: () => import("shiki/dist/langs/java.mjs").then(module => module.default),
  javascript: () =>
    import("shiki/dist/langs/javascript.mjs").then(module => module.default),
  json: () => import("shiki/dist/langs/json.mjs").then(module => module.default),
  jsx: () => import("shiki/dist/langs/jsx.mjs").then(module => module.default),
  kotlin: () =>
    import("shiki/dist/langs/kotlin.mjs").then(module => module.default),
  markdown: () =>
    import("shiki/dist/langs/markdown.mjs").then(module => module.default),
  php: () => import("shiki/dist/langs/php.mjs").then(module => module.default),
  python: () =>
    import("shiki/dist/langs/python.mjs").then(module => module.default),
  ruby: () => import("shiki/dist/langs/ruby.mjs").then(module => module.default),
  rust: () => import("shiki/dist/langs/rust.mjs").then(module => module.default),
  shell: () =>
    import("shiki/dist/langs/shell.mjs").then(module => module.default),
  sql: () => import("shiki/dist/langs/sql.mjs").then(module => module.default),
  swift: () =>
    import("shiki/dist/langs/swift.mjs").then(module => module.default),
  tsx: () => import("shiki/dist/langs/tsx.mjs").then(module => module.default),
  typescript: () =>
    import("shiki/dist/langs/typescript.mjs").then(module => module.default),
  xml: () => import("shiki/dist/langs/xml.mjs").then(module => module.default),
  yaml: () => import("shiki/dist/langs/yaml.mjs").then(module => module.default),
} as const;

type SupportedArticleCodeLanguageId =
  keyof typeof ARTICLE_CODE_LANGUAGE_LOADERS;

const supportsArticleCodeLanguage = (
  language: string
): language is SupportedArticleCodeLanguageId =>
  Object.hasOwn(ARTICLE_CODE_LANGUAGE_LOADERS, language);

const createArticleCodeHighlighter = createBundledHighlighter({
  langs: ARTICLE_CODE_LANGUAGE_LOADERS,
  themes: {
    [ARTICLE_CODE_THEME]: () =>
      import("shiki/dist/themes/min-light.mjs").then(module => module.default),
  },
  engine: createJavaScriptRegexEngine,
});

const { codeToHtml } = createSingletonShorthands(createArticleCodeHighlighter);

const resolveArticleCodeLanguage = (language: string) =>
  supportsArticleCodeLanguage(language) ? language : "plaintext";

export const highlightArticleCode = (code: string, language: string) =>
  codeToHtml(code, {
    lang: resolveArticleCodeLanguage(language),
    theme: ARTICLE_CODE_THEME,
  });
