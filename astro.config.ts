import { defineConfig, envField, fontProviders } from "astro/config";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";

import { SITE } from "./src/config";
import {
  ASTRO_FONT_REGISTRATIONS,
  type FontProviderName,
  resolveFontProviderName,
} from "./src/config/fonts";
import { rehypeArticleCodeBlocks } from "./src/plugins/rehypeArticleCodeBlocks";
import { codeLanguageShikiAliases } from "./src/utils/codeLanguage";

function getAstroFontProvider(provider: FontProviderName) {
  switch (resolveFontProviderName(provider)) {
    case "google":
      return fontProviders.google();
  }
}

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    rehypePlugins: [rehypeHeadingIds, rehypeArticleCodeBlocks],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      langAlias: codeLanguageShikiAliases,
      wrap: false,
      transformers: [
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 800,
    },
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
    fonts: ASTRO_FONT_REGISTRATIONS.map(font => ({
      name: font.name,
      provider: getAstroFontProvider(font.provider),
      cssVariable: font.cssVariable,
      fallbacks: [...font.fallbacks],
      weights: [...font.weights],
      styles: [...font.styles],
    })),
  },
});
