export interface PostOutlineItem {
  depth: 2 | 3;
  slug: string;
  text: string;
}

export const MIN_POST_OUTLINE_ITEMS = 3;

interface OutlineHeadingLike {
  depth: number;
  slug: string;
  text: string;
}

const isOutlineHeading = (
  heading: OutlineHeadingLike
): heading is OutlineHeadingLike & { depth: 2 | 3 } =>
  (heading.depth === 2 || heading.depth === 3) &&
  heading.slug.trim().length > 0 &&
  heading.text.trim().length > 0;

export const getPostOutline = (
  headings: OutlineHeadingLike[]
): PostOutlineItem[] =>
  headings
    .filter(isOutlineHeading)
    .map(({ depth, slug, text }) => ({
      depth,
      slug,
      text: text.trim(),
    }));
