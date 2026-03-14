const DESKTOP_BREAKPOINT_QUERY = "(min-width: 960px)";
const HOVER_POINTER_QUERY = "(hover: hover)";
const DESKTOP_OUTLINE_SELECTOR = '[data-post-outline="desktop"]';
const POST_ROOT_SELECTOR = "#post";
const ARTICLE_CONTENT_SELECTOR = `${POST_ROOT_SELECTOR} .post-content`;
const READER_PROGRESS_SELECTOR = "[data-reader-progress]";
const READER_PROGRESS_FILL_SELECTOR = "[data-reader-progress-fill]";
const CODE_BLOCK_SELECTOR = "pre, .astro-code";
const ACTIVE_CLASS = "is-active";
const INDICATOR_INSET_Y = 6;
const NAVIGATION_LOCK_TIMEOUT_MS = 1600;
const COPY_RESET_TIMEOUT_MS = 1800;

type Cleanup = () => void;

interface OutlineEntry {
  heading: HTMLElement;
  link: HTMLAnchorElement;
}

interface DesktopOutlineNodes {
  indicator: HTMLElement;
  nav: HTMLElement;
  entries: OutlineEntry[];
}

interface ReaderProgressNodes {
  article: HTMLElement;
  fill: HTMLElement;
}

interface CodeCopyEntry {
  wrapper: HTMLDivElement;
  block: HTMLElement;
  button: HTMLButtonElement;
}

declare global {
  interface Window {
    __articleReaderRuntimeAttached?: boolean;
    __articleReaderRuntimeCleanup?: Cleanup | null;
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseCssLength = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (trimmed.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const remValue = Number.parseFloat(trimmed);
    return Number.isFinite(rootFontSize) && Number.isFinite(remValue)
      ? remValue * rootFontSize
      : 0;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPostRoot = () => document.querySelector<HTMLElement>(POST_ROOT_SELECTOR);

const getHeadingOffset = () => {
  const postRoot = getPostRoot();
  if (!postRoot) return 104;

  const rawValue = getComputedStyle(postRoot).getPropertyValue(
    "--post-heading-scroll-offset"
  );

  return parseCssLength(rawValue) || 104;
};

const getActivationLine = () => getHeadingOffset() + 8;

const getMaxScrollTop = () =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

const isNearDocumentEnd = () => getMaxScrollTop() - window.scrollY <= 2;

const getLocationWithoutHash = () =>
  `${window.location.pathname}${window.location.search}`;

const getAbsoluteTop = (element: HTMLElement) =>
  window.scrollY + element.getBoundingClientRect().top;

const hasReachedEntry = (entry: OutlineEntry) =>
  entry.heading.getBoundingClientRect().top <= getActivationLine() ||
  isNearDocumentEnd();

const shouldHandleOutlineClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

const shouldEnableDesktopOutline = () =>
  window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches &&
  window.matchMedia(HOVER_POINTER_QUERY).matches;

const onMediaChange = (
  mediaQueryList: MediaQueryList,
  listener: () => void
): Cleanup => {
  if (typeof mediaQueryList.addEventListener !== "function") {
    return () => {};
  }

  const handleChange = () => {
    listener();
  };

  mediaQueryList.addEventListener("change", handleChange);
  return () => mediaQueryList.removeEventListener("change", handleChange);
};

const cleanupMountedRuntime = () => {
  window.__articleReaderRuntimeCleanup?.();
  window.__articleReaderRuntimeCleanup = null;
};

const queryReaderProgressNodes = (): ReaderProgressNodes | null => {
  const article = document.querySelector<HTMLElement>(ARTICLE_CONTENT_SELECTOR);
  const root = document.querySelector<HTMLElement>(READER_PROGRESS_SELECTOR);
  const fill = root?.querySelector<HTMLElement>(READER_PROGRESS_FILL_SELECTOR);

  if (!article || !root || !fill) return null;

  return { article, fill };
};

const queryCodeBlocks = () => {
  const article = document.querySelector<HTMLElement>(ARTICLE_CONTENT_SELECTOR);
  if (!article) return [];

  return [...article.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR)].filter(
    (block, index, blocks) => blocks.indexOf(block) === index
  );
};

const queryDesktopOutlineNodes = (): DesktopOutlineNodes | null => {
  if (!shouldEnableDesktopOutline()) return null;

  const root = document.querySelector<HTMLElement>(DESKTOP_OUTLINE_SELECTOR);
  const nav = root?.querySelector<HTMLElement>(".post-outline-nav");
  const indicator = root?.querySelector<HTMLElement>(".post-outline-indicator");

  if (!root || !nav || !indicator) return null;

  const entries = [
    ...root.querySelectorAll<HTMLAnchorElement>(
      ".post-outline-link[data-outline-target]"
    ),
  ]
    .map(link => {
      const slug = link.dataset.outlineTarget?.trim();
      const heading = slug ? document.getElementById(slug) : null;

      if (!slug || !(heading instanceof HTMLElement)) {
        return null;
      }

      return { heading, link };
    })
    .filter((entry): entry is OutlineEntry => entry !== null);

  if (entries.length === 0) return null;

  return { indicator, nav, entries };
};

const pickActiveEntry = (entries: OutlineEntry[]) => {
  if (isNearDocumentEnd()) {
    return entries.at(-1) ?? entries[0];
  }

  const activationLine = getActivationLine();
  let activeEntry = entries[0];

  for (const entry of entries) {
    if (entry.heading.getBoundingClientRect().top <= activationLine) {
      activeEntry = entry;
      continue;
    }

    break;
  }

  return activeEntry;
};

const getReaderProgress = (article: HTMLElement) => {
  const articleTop = getAbsoluteTop(article);
  const articleHeight = article.getBoundingClientRect().height;
  const start = Math.max(0, articleTop - getHeadingOffset());
  const end = Math.max(
    start + 1,
    articleTop + articleHeight - window.innerHeight + getHeadingOffset()
  );

  return clamp((window.scrollY - start) / (end - start), 0, 1);
};

const copyTextToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

const getCodeBlockText = (block: HTMLElement) =>
  block.querySelector("code")?.textContent ?? block.textContent ?? "";

const mountReaderProgressController = (): Cleanup => {
  const queried = queryReaderProgressNodes();
  if (!queried) return () => {};

  const { article, fill } = queried;
  let frameId = 0;
  let resizeObserver: ResizeObserver | null = null;

  const renderProgress = () => {
    fill.style.transform = `scaleX(${getReaderProgress(article).toFixed(4)})`;
  };

  const scheduleProgress = () => {
    if (frameId) return;

    frameId = requestAnimationFrame(() => {
      frameId = 0;
      renderProgress();
    });
  };

  const handleScroll = () => {
    scheduleProgress();
  };

  const handleResize = () => {
    scheduleProgress();
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      scheduleProgress();
    });
    resizeObserver.observe(article);
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });

  renderProgress();

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
    resizeObserver?.disconnect();
    if (frameId) cancelAnimationFrame(frameId);
    fill.style.transform = "scaleX(0)";
  };
};

const mountCodeCopyController = (): Cleanup => {
  if (!navigator.clipboard?.writeText) return () => {};

  const codeBlocks = queryCodeBlocks();
  if (codeBlocks.length === 0) return () => {};

  const entries: CodeCopyEntry[] = [];
  const cleanups: Cleanup[] = [];

  codeBlocks.forEach(block => {
    const parent = block.parentElement;
    if (!parent) return;

    const wrapper = document.createElement("div");
    wrapper.className = "article-code-block";
    wrapper.dataset.copyState = "idle";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "article-code-copy font-ui";
    button.setAttribute("aria-label", "Copy code block");
    button.textContent = "Copy";

    parent.insertBefore(wrapper, block);
    wrapper.appendChild(block);
    wrapper.appendChild(button);

    entries.push({ wrapper, block, button });
  });

  entries.forEach(({ wrapper, block, button }) => {
    let resetTimeoutId = 0;

    const resetButtonState = () => {
      wrapper.dataset.copyState = "idle";
      button.textContent = "Copy";
      button.removeAttribute("disabled");
    };

    const scheduleReset = () => {
      if (resetTimeoutId) window.clearTimeout(resetTimeoutId);
      resetTimeoutId = window.setTimeout(() => {
        resetTimeoutId = 0;
        resetButtonState();
      }, COPY_RESET_TIMEOUT_MS);
    };

    const handleClick = async () => {
      const text = getCodeBlockText(block);
      if (!text.trim()) return;

      button.setAttribute("disabled", "true");

      try {
        await copyTextToClipboard(text);
        wrapper.dataset.copyState = "copied";
        button.textContent = "Copied";
      } catch {
        wrapper.dataset.copyState = "error";
        button.textContent = "Failed";
      } finally {
        button.removeAttribute("disabled");
        scheduleReset();
      }
    };

    button.addEventListener("click", handleClick);

    cleanups.push(() => {
      button.removeEventListener("click", handleClick);
      if (resetTimeoutId) window.clearTimeout(resetTimeoutId);
      const hostParent = wrapper.parentElement;
      if (hostParent) {
        hostParent.insertBefore(block, wrapper);
        wrapper.remove();
      }
    });
  });

  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};

const mountDesktopOutlineController = (): Cleanup => {
  const queried = queryDesktopOutlineNodes();
  if (!queried) return () => {};

  const { indicator, nav, entries } = queried;
  let activeEntry = pickActiveEntry(entries);
  let hoveredEntry: OutlineEntry | null = null;
  let lockedEntry: OutlineEntry | null = null;
  let navigationLockTimeoutId = 0;
  let indicatorFrameId = 0;
  let syncFrameId = 0;

  const setActiveState = (nextActive: OutlineEntry) => {
    activeEntry = nextActive;
    entries.forEach(({ link }) => {
      link.classList.toggle(ACTIVE_CLASS, link === nextActive.link);
    });
  };

  const getDisplayedEntry = () => hoveredEntry ?? lockedEntry ?? activeEntry;

  const clearNavigationLock = () => {
    lockedEntry = null;
    if (!navigationLockTimeoutId) return;

    window.clearTimeout(navigationLockTimeoutId);
    navigationLockTimeoutId = 0;
  };

  const scheduleSyncActiveEntry = () => {
    if (syncFrameId) return;

    syncFrameId = requestAnimationFrame(() => {
      syncFrameId = 0;
      syncActiveEntry();
    });
  };

  const lockNavigationToEntry = (entry: OutlineEntry) => {
    clearNavigationLock();
    lockedEntry = entry;

    navigationLockTimeoutId = window.setTimeout(() => {
      navigationLockTimeoutId = 0;
      lockedEntry = null;
      scheduleSyncActiveEntry();
    }, NAVIGATION_LOCK_TIMEOUT_MS);
  };

  const scrollToEntry = (entry: OutlineEntry) => {
    const targetTop = Math.min(
      Math.max(
        0,
        window.scrollY + entry.heading.getBoundingClientRect().top - getHeadingOffset()
      ),
      getMaxScrollTop()
    );

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  const renderIndicator = (entry: OutlineEntry | null) => {
    if (!entry) {
      indicator.style.opacity = "0";
      indicator.style.height = "0";
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = entry.link.getBoundingClientRect();
    const height = Math.max(0, linkRect.height - INDICATOR_INSET_Y * 2);
    const nextTop = Math.max(0, linkRect.top - navRect.top + INDICATOR_INSET_Y);

    indicator.style.opacity = "1";
    indicator.style.height = `${Math.round(height)}px`;
    indicator.style.transform = `translateY(${Math.round(nextTop)}px)`;
  };

  const scheduleIndicator = (entry: OutlineEntry | null) => {
    if (indicatorFrameId) cancelAnimationFrame(indicatorFrameId);

    indicatorFrameId = requestAnimationFrame(() => {
      indicatorFrameId = 0;
      renderIndicator(entry);
    });
  };

  const syncIndicatorToCurrentEntry = () => {
    scheduleIndicator(getDisplayedEntry());
  };

  const syncActiveEntry = () => {
    if (lockedEntry) {
      if (!hasReachedEntry(lockedEntry)) {
        setActiveState(lockedEntry);
        syncIndicatorToCurrentEntry();
        return;
      }

      clearNavigationLock();
    }

    setActiveState(pickActiveEntry(entries));
    syncIndicatorToCurrentEntry();
  };

  const linkCleanup = entries.flatMap(entry => {
    const handleIntentStart = () => {
      if (lockedEntry) return;
      hoveredEntry = entry;
      syncIndicatorToCurrentEntry();
    };

    const handleClick = (event: MouseEvent) => {
      if (!shouldHandleOutlineClick(event)) return;

      event.preventDefault();
      hoveredEntry = null;
      lockNavigationToEntry(entry);
      setActiveState(entry);
      syncIndicatorToCurrentEntry();
      history.replaceState(history.state, "", getLocationWithoutHash());
      scrollToEntry(entry);
    };

    entry.link.addEventListener("mouseenter", handleIntentStart);
    entry.link.addEventListener("focus", handleIntentStart);
    entry.link.addEventListener("click", handleClick);

    return [
      () => entry.link.removeEventListener("mouseenter", handleIntentStart),
      () => entry.link.removeEventListener("focus", handleIntentStart),
      () => entry.link.removeEventListener("click", handleClick),
    ];
  });

  const handleMouseLeave = () => {
    if (lockedEntry) return;
    hoveredEntry = null;
    syncIndicatorToCurrentEntry();
  };

  const handleFocusOut = (event: FocusEvent) => {
    if (lockedEntry) return;

    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && nav.contains(relatedTarget)) return;

    hoveredEntry = null;
    syncIndicatorToCurrentEntry();
  };

  const handleScroll = () => {
    scheduleSyncActiveEntry();
  };

  const handleResize = () => {
    scheduleSyncActiveEntry();
  };

  const handleHashChange = () => {
    scheduleSyncActiveEntry();
  };

  nav.addEventListener("mouseleave", handleMouseLeave);
  nav.addEventListener("focusout", handleFocusOut);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("hashchange", handleHashChange);

  setActiveState(activeEntry);
  renderIndicator(activeEntry);

  return () => {
    clearNavigationLock();
    nav.removeEventListener("mouseleave", handleMouseLeave);
    nav.removeEventListener("focusout", handleFocusOut);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("hashchange", handleHashChange);
    linkCleanup.forEach(cleanup => cleanup());
    if (indicatorFrameId) cancelAnimationFrame(indicatorFrameId);
    if (syncFrameId) cancelAnimationFrame(syncFrameId);
    indicator.style.opacity = "0";
    indicator.style.height = "0";
  };
};

const mountArticleReaderRuntime = () => {
  cleanupMountedRuntime();

  const cleanups = [
    mountReaderProgressController(),
    mountCodeCopyController(),
    mountDesktopOutlineController(),
  ];

  window.__articleReaderRuntimeCleanup = () => {
    cleanups.forEach(cleanup => cleanup());
  };
};

export function initArticleReaderRuntime() {
  if (typeof window === "undefined") return;

  mountArticleReaderRuntime();

  if (window.__articleReaderRuntimeAttached) return;

  window.__articleReaderRuntimeAttached = true;
  document.addEventListener("astro:after-swap", () => {
    mountArticleReaderRuntime();
  });
  onMediaChange(window.matchMedia(DESKTOP_BREAKPOINT_QUERY), () => {
    mountArticleReaderRuntime();
  });
  onMediaChange(window.matchMedia(HOVER_POINTER_QUERY), () => {
    mountArticleReaderRuntime();
  });
}
