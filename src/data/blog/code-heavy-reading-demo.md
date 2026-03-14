---
title: "Code-Heavy Reading Demo"
description: "A sample article for validating long-form typography, mobile code overflow, and figure rhythm."
pubDatetime: 2026-03-14T06:15:00.000Z
tags:
  - reader-experience
  - code-heavy
---

This sample article exists to validate how the article body behaves when prose, code, lists, quotes, and figures all appear in the same reading flow. It is intentionally denser than the outline demo so `ECA-77` can be judged against a page that actually pressures spacing and mobile overflow.

## Why code-heavy posts feel cramped

Code articles usually fail when every element fights for the same amount of visual weight. Paragraphs feel narrow, inline code reads like UI chrome, and long blocks push the page wider than the viewport. The goal is not to make code dramatic; it is to make the reading pace calmer.

### Let code blocks breathe

Even a short explanation can feel abrupt if it runs straight into a large block. The block needs enough perimeter and a readable measure, especially when a line like `const canonicalPath = getPath(post.id, post.filePath, true)` forces horizontal scrolling on small screens.

```typescript
export const createReaderSnapshot = (postId: string, viewportWidth: number) => {
  const canonicalPath = `/articles/${postId}/?preview=reader-experience&viewport=${viewportWidth}&mode=code-heavy-layout-validation`;

  return {
    canonicalPath,
    shouldShowOutline: viewportWidth >= 960,
    shouldEnableProgress: true,
    emphasis: "calm",
  };
};
```

### Lists and callouts still matter

> Long-form technical writing is easier to trust when the page rhythm makes each transition feel deliberate instead of improvised.

- Good long-form rhythm usually means:
  - prose blocks have enough vertical breathing room
  - code blocks read as pauses, not collisions
  - lists can nest without turning into a wall of indented bullets
- The page should still feel editorial, not like a pasted README

## Mobile overflow should feel intentional

On mobile, a code block that scrolls sideways is acceptable. A whole page that scrolls sideways is not. That means the scroller has to live inside the block, with touch-friendly padding and enough contrast that the code still feels anchored to the article.

```shell
pnpm run build && pnpm run preview -- --host 127.0.0.1 --port 4328 && curl "https://example.com/articles/code-heavy-reading-demo/?viewport=390&behavior=progress-bar-and-outline-regression-check"
```

### Nested steps should stay readable

1. Start with the narrative layer.
2. Introduce the command or code.
3. Follow the block with a short interpretation.
4. Keep nested detail readable:
   - explain why the command exists
   - explain what the risky part is
   - explain what result the reader should expect

## Figures and captions need rhythm too

A figure should not feel like an unrelated card dropped into the article. The caption should read like a small editorial note tied to the image, not like a detached system label.

<figure>
  <img src="/reader-layout-demo.svg" alt="A quiet editorial mockup with a code block, annotation card, and soft paper-toned surfaces." loading="lazy" />
  <figcaption>
    A lightweight composition study for code-heavy reading: one dominant code block, one small note card, and enough negative space to keep the page from feeling mechanical.
  </figcaption>
</figure>

## Inline code should stay quiet in prose

Inline code works best when it stays quiet enough to live inside a sentence. Something like `pnpm run validate:release`, `astro check`, or `articleReaderRuntime.ts` should feel marked, but not loud enough to break the rhythm of the paragraph around it.

```json
{
  "readerExperience": {
    "progressBar": "article-only",
    "desktopOutline": "sticky side rail",
    "mobileBehavior": "collapsible summary",
    "designGoal": "calm long-form reading"
  }
}
```

The ideal result is simple: a reader should be able to skim, stop at a code block, recover their place, and continue without the page ever feeling cramped or brittle.
