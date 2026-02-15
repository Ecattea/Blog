# Blog

Demo-inspired multi-page blog built with Astro.

## Project map

| Resource | Location | Notes |
| --- | --- | --- |
| Articles (Markdown) | `src/data/blog/**/*.md` | Main content source |
| Content schema | `src/content.config.ts` | Frontmatter validation |
| Home route | `src/pages/index.astro` | `/` |
| Articles list | `src/pages/articles/[...page].astro` | `/articles/` (paginated) |
| Article detail | `src/pages/articles/[...slug]/index.astro` | `/articles/<slug>/` |
| Article OG image | `src/pages/articles/[...slug]/index.png.ts` | `/articles/<slug>/index.png` |
| Site OG image | `src/pages/og.png.ts` | `/og.png` |
| About | `src/pages/about/index.astro` | `/about/` |
| Tags | `src/pages/tags/index.astro` | `/tags/` |
| Tag detail | `src/pages/tags/[tag]/[...page].astro` | `/tags/<tag>/` (paginated) |
| Search | `src/pages/search.astro` | `/search/` (Pagefind UI) |
| Archives | `src/pages/archives/index.astro` | `/archives/` |
| Shared layout | `src/layouts/Layout.astro` | Fonts + view transitions + ambient + dock |
| Design tokens | `src/styles/tokens.css` | `:root` variables |
| Global styles | `src/styles/global.css` | Demo-derived components + transitions |
| UI components | `src/components/` | `AmbientBackground`, `DockNav`, etc. |
| Static assets | `public/` | Optional; `public/pagefind/` is generated for local dev (gitignored) |
| Build output | `dist/` | Deployed assets |
| Workers deploy config | `wrangler.jsonc` | `assets.directory = "./dist"` |

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (Cloudflare Workers static assets)

This project deploys `dist/` as static assets via `wrangler.jsonc`.

```bash
npm run build
npx wrangler@latest deploy
```

## Notes

- Pagefind search index is generated during `npm run build`. In dev mode, run one build first to see results in `/search/`.
