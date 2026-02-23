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
export type PostQueryOptions = domain.PostQueryOptions;

export type TagSummary = domain.TagSummary;
export type ArchiveMonthGroup = domain.ArchiveMonthGroup;
export type ArchiveYearGroup = domain.ArchiveYearGroup;

export const matchesPostQuery = (
  post: BlogPost,
  options: PostQueryOptions = {}
) => domain.matchesPostQuery(post, options);

export const applyPostQuery = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => domain.applyPostQuery(posts, options);

export const getPublishedPosts = async (options: PostQueryOptions = {}) =>
  domain.getPublishedPosts(options);

export const getTagSummariesFromPosts = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => domain.getTagSummariesFromPosts(posts, options);

export const getTagSummaries = async (options: PostQueryOptions = {}) =>
  domain.getTagSummaries(options);

export const getPostsByTagFromPosts = (
  posts: BlogPost[],
  tag: string,
  options: PostQueryOptions = {}
) => domain.getPostsByTagFromPosts(posts, tag, options);

export const getPostsByTag = async (
  tag: string,
  options: PostQueryOptions = {}
) => domain.getPostsByTag(tag, options);

export const getArchiveGroupsFromPosts = (
  posts: BlogPost[],
  options: PostQueryOptions = {}
) => domain.getArchiveGroupsFromPosts(posts, options);

export const getArchiveGroups = async (options: PostQueryOptions = {}) =>
  domain.getArchiveGroups(options);
