import * as domain from "@/domain/posts";

/**
 * Temporary compatibility facade during ECA-58 migration.
 *
 * New or migrated callers should import from "@/domain/posts" directly.
 * This facade stays only to avoid one-shot rewiring risk and will be
 * retired after ECA-58 child issues complete (target: ECA-68).
 */
export type BlogPost = domain.BlogPost;
export type PostSortField = domain.PostSortField;

export interface PostQueryOptions {
  /**
   * @deprecated Publication state toggles are removed. This option has no effect.
   */
  includeDraft?: boolean;
  /**
   * @deprecated Scheduled publication is removed. This option has no effect.
   */
  now?: Date;
  timezone?: string;
  sortBy?: PostSortField;
}

export type TagSummary = domain.TagSummary;
export type ArchiveMonthGroup = domain.ArchiveMonthGroup;
export type ArchiveYearGroup = domain.ArchiveYearGroup;

const toDomainOptions = (
  options: PostQueryOptions = {}
): domain.PostQueryOptions => ({
  timezone: options.timezone,
  sortBy: options.sortBy,
});

export const matchesPostQuery = (
  post: BlogPost,
  options: PostQueryOptions = {}
) => domain.matchesPostQuery(post, toDomainOptions(options));

export const applyPostQuery = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => domain.applyPostQuery(posts, toDomainOptions(options));

export const getPublishedPosts = async (options: PostQueryOptions = {}) =>
  domain.getPublishedPosts(toDomainOptions(options));

export const getTagSummariesFromPosts = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => domain.getTagSummariesFromPosts(posts, toDomainOptions(options));

export const getTagSummaries = async (options: PostQueryOptions = {}) =>
  domain.getTagSummaries(toDomainOptions(options));

export const getPostsByTagFromPosts = (
  posts: BlogPost[],
  tag: string,
  options: PostQueryOptions = {}
) => domain.getPostsByTagFromPosts(posts, tag, toDomainOptions(options));

export const getPostsByTag = async (
  tag: string,
  options: PostQueryOptions = {}
) => domain.getPostsByTag(tag, toDomainOptions(options));

export const getArchiveGroupsFromPosts = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => domain.getArchiveGroupsFromPosts(posts, toDomainOptions(options));

export const getArchiveGroups = async (options: PostQueryOptions = {}) =>
  domain.getArchiveGroups(toDomainOptions(options));
