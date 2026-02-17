import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "@/config";
import { slugifyAll, slugifyStr } from "./slugify";

export type BlogPost = CollectionEntry<"blog">;
export type PostSortField = "pubDatetime" | "modDatetime";

export interface PostQueryOptions {
  includeDraft?: boolean;
  now?: Date;
  timezone?: string;
  sortBy?: PostSortField;
}

export interface TagSummary {
  tag: string;
  tagName: string;
  count: number;
}

export interface ArchiveMonthGroup {
  month: number;
  monthLabel: string;
  posts: BlogPost[];
}

export interface ArchiveYearGroup {
  year: number;
  postCount: number;
  months: ArchiveMonthGroup[];
}

type ResolvedPostQueryOptions = Required<PostQueryOptions>;

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const DEFAULT_TIMEZONE = "UTC";

const resolveTimeZone = (timezone?: string) => {
  const candidate = timezone?.trim() || SITE.timezone || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const resolveQueryOptions = (
  options: PostQueryOptions = {}
): ResolvedPostQueryOptions => ({
  includeDraft: options.includeDraft ?? false,
  now: options.now ?? new Date(),
  timezone: resolveTimeZone(options.timezone),
  sortBy: options.sortBy ?? "modDatetime",
});

const getSortTimestamp = (post: BlogPost, sortBy: PostSortField) => {
  if (sortBy === "pubDatetime") {
    return post.data.pubDatetime.getTime();
  }
  return (post.data.modDatetime ?? post.data.pubDatetime).getTime();
};

const isPublishedPost = (
  post: BlogPost,
  options: ResolvedPostQueryOptions
): boolean => {
  if (options.includeDraft) {
    return true;
  }

  if (post.data.draft) {
    return false;
  }

  if (import.meta.env.DEV) {
    return true;
  }

  const publishAt = post.data.pubDatetime.getTime() - SITE.scheduledPostMargin;
  return options.now.getTime() > publishAt;
};

export const matchesPostQuery = (
  post: BlogPost,
  options: PostQueryOptions = {}
) => {
  const resolvedOptions = resolveQueryOptions(options);
  return isPublishedPost(post, resolvedOptions);
};

export const applyPostQuery = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => {
  const resolvedOptions = resolveQueryOptions(options);

  return posts
    .filter(post => isPublishedPost(post, resolvedOptions))
    .sort(
      (a, b) =>
        getSortTimestamp(b, resolvedOptions.sortBy) -
        getSortTimestamp(a, resolvedOptions.sortBy)
    );
};

export const getPublishedPosts = async (options: PostQueryOptions = {}) => {
  const posts = await getCollection("blog");
  return applyPostQuery(posts, options);
};

export const getTagSummariesFromPosts = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => {
  const postList = applyPostQuery(posts, options);
  const tagMap = new Map<string, TagSummary>();

  for (const post of postList) {
    for (const rawTag of post.data.tags) {
      const normalizedTag = slugifyStr(rawTag);
      const existing = tagMap.get(normalizedTag);

      if (existing) {
        existing.count += 1;
        continue;
      }

      tagMap.set(normalizedTag, {
        tag: normalizedTag,
        tagName: rawTag,
        count: 1,
      });
    }
  }

  return [...tagMap.values()].sort((a, b) => a.tag.localeCompare(b.tag));
};

export const getTagSummaries = async (options: PostQueryOptions = {}) => {
  const posts = await getCollection("blog");
  return getTagSummariesFromPosts(posts, options);
};

export const getPostsByTagFromPosts = (
  posts: BlogPost[],
  tag: string,
  options: PostQueryOptions = {}
) => {
  const normalizedTag = slugifyStr(tag);
  const postList = applyPostQuery(posts, options);

  return postList.filter(post =>
    slugifyAll(post.data.tags).includes(normalizedTag)
  );
};

export const getPostsByTag = async (
  tag: string,
  options: PostQueryOptions = {}
) => {
  const posts = await getCollection("blog");
  return getPostsByTagFromPosts(posts, tag, options);
};

const getYearMonthInTimeZone = (date: Date, timezone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);

  if (Number.isFinite(year) && Number.isFinite(month)) {
    return { year, month };
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
};

export const getArchiveGroupsFromPosts = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
): ArchiveYearGroup[] => {
  const resolvedOptions = resolveQueryOptions({
    sortBy: "pubDatetime",
    ...options,
  });
  const postList = applyPostQuery(posts, resolvedOptions);
  const grouped = new Map<number, Map<number, BlogPost[]>>();

  for (const post of postList) {
    const { year, month } = getYearMonthInTimeZone(
      post.data.pubDatetime,
      resolvedOptions.timezone
    );

    const monthGroups = grouped.get(year) ?? new Map<number, BlogPost[]>();
    const monthPosts = monthGroups.get(month) ?? [];
    monthPosts.push(post);
    monthGroups.set(month, monthPosts);
    grouped.set(year, monthGroups);
  }

  return [...grouped.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, monthGroups]) => {
      const months = [...monthGroups.entries()]
        .sort(([monthA], [monthB]) => monthB - monthA)
        .map(([month, monthPosts]) => ({
          month,
          monthLabel: MONTH_LABELS[month - 1] ?? "Unknown",
          posts: applyPostQuery(monthPosts, resolvedOptions),
        }));

      return {
        year,
        postCount: months.reduce(
          (count, month) => count + month.posts.length,
          0
        ),
        months,
      };
    });
};

export const getArchiveGroups = async (options: PostQueryOptions = {}) => {
  const posts = await getCollection("blog");
  return getArchiveGroupsFromPosts(posts, options);
};
