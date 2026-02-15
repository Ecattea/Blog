# Blog

Demo-inspired multi-page blog built with Astro.

## Routes

- `/` — Home
- `/articles/` — Articles (paginated)
- `/articles/<slug>/` — Article detail
- `/about/` — About
- `/tags/` — Tags index
- `/tags/<tag>/` — Tag detail (paginated)
- `/search/` — Full-text search (Pagefind)
- `/archives/` — Archives

## Content

Posts live in `src/data/blog/` as Markdown files.

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
