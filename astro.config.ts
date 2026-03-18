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
import { rehypeArticleCodeBlocks } from "./src/plugins/rehypeArticleCodeBlocks";
import { codeLanguageShikiAliases } from "./src/utils/codeLanguage";

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
    fonts: [
      {
        name: "Inter",
        provider: fontProviders.google(),
        cssVariable: "--font-ui-source",
        fallbacks: ["sans-serif"],
        weights: [400, 500],
        styles: ["normal"],
      },
      {
        name: "Source Serif 4",
        provider: fontProviders.google(),
        cssVariable: "--font-body-source",
        fallbacks: ["serif"],
        weights: [400, 600],
        styles: ["normal", "italic"],
      },
      {
        name: "Playfair Display",
        provider: fontProviders.google(),
        cssVariable: "--font-display-source",
        fallbacks: ["serif"],
        weights: [400, 600],
        styles: ["normal", "italic"],
      },
    ],
  },
});
