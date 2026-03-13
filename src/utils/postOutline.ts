import type { MarkdownHeading } from "astro";

export interface PostOutlineItem {
  depth: 2 | 3;
  slug: string;
  text: string;
}

export const MIN_POST_OUTLINE_ITEMS = 3;

const isOutlineHeading = (
  heading: MarkdownHeading
): heading is MarkdownHeading & { depth: 2 | 3 } =>
  (heading.depth === 2 || heading.depth === 3) &&
  heading.slug.trim().length > 0 &&
  heading.text.trim().length > 0;

export const getPostOutline = (
  headings: MarkdownHeading[]
): PostOutlineItem[] =>
  headings
    .filter(isOutlineHeading)
    .map(({ depth, slug, text }) => ({
      depth,
      slug,
      text: text.trim(),
    }));

export const shouldShowPostOutline = (outline: PostOutlineItem[]) =>
  outline.length >= MIN_POST_OUTLINE_ITEMS;
