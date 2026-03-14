import { highlightArticleCode } from "@/scripts/articleCodeHighlighter";
import {
  codeLanguagePickerOptions,
  formatCodeLanguageLabel,
  getCodeLanguagePickerLabel,
  resolveCodeLanguageId,
  resolveCodeLanguagePickerId,
  sortCodeLanguagePickerOptions,
  type CodeLanguagePickerOption,
} from "@/utils/codeLanguage";

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

interface CodeLanguagePickerOptionNode extends CodeLanguagePickerOption {
  element: HTMLDivElement;
}

interface CodeLanguagePickerNodes {
  container: HTMLDivElement;
  trigger: HTMLButtonElement;
  triggerLabel: HTMLSpanElement;
  panel: HTMLDivElement;
  scrollArea: HTMLDivElement;
  options: CodeLanguagePickerOptionNode[];
}

interface CodeBlockEntry {
  wrapper: HTMLDivElement;
  preserveWrapper: boolean;
  button: HTMLButtonElement | null;
  picker: CodeLanguagePickerNodes;
  block: HTMLElement;
  sourceText: string;
  defaultLanguageId: string;
  currentLanguageId: string;
  defaultMarkup: string;
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

const getPostRoot = () =>
  document.querySelector<HTMLElement>(POST_ROOT_SELECTOR);

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

  return [...article.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR)];
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

const getDeclaredCodeLanguage = (block: HTMLElement) =>
  block.dataset.language?.trim() ??
  [...block.classList]
    .find(token => token.startsWith("language-"))
    ?.slice("language-".length) ??
  "";

const getCodeLanguageLabel = (block: HTMLElement) =>
  formatCodeLanguageLabel(getDeclaredCodeLanguage(block));

const isCodeBlockWrapper = (
  element: Element | null
): element is HTMLDivElement =>
  element instanceof HTMLDivElement &&
  element.classList.contains("article-code-block");

const ensureCodeBlockWrapper = (block: HTMLElement) => {
  const parent = block.parentElement;
  if (isCodeBlockWrapper(parent)) {
    if (!parent.dataset.copyState) {
      parent.dataset.copyState = "idle";
    }

    return { wrapper: parent, preserveWrapper: true };
  }

  if (!parent) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "article-code-block";
  wrapper.dataset.copyState = "idle";
  parent.insertBefore(wrapper, block);
  wrapper.appendChild(block);

  return { wrapper, preserveWrapper: false };
};

const setCodeLanguageLabel = (
  wrapper: HTMLDivElement,
  languageId: string,
  fallbackLabel = ""
) => {
  const nextLabel = getCodeLanguagePickerLabel(languageId) || fallbackLabel;

  if (nextLabel) {
    wrapper.dataset.codeLanguage = nextLabel;
    return;
  }

  delete wrapper.dataset.codeLanguage;
};

const createCodeLanguagePickerOptions = (
  selectedLanguageId: string,
  selectedLanguageLabel = ""
) => {
  if (!selectedLanguageId) {
    return [...codeLanguagePickerOptions];
  }

  if (
    codeLanguagePickerOptions.some(option => option.id === selectedLanguageId)
  ) {
    return [...codeLanguagePickerOptions];
  }

  return [
    ...sortCodeLanguagePickerOptions([
      {
        id: selectedLanguageId,
        label:
          selectedLanguageLabel || getCodeLanguagePickerLabel(selectedLanguageId),
      },
      ...codeLanguagePickerOptions,
    ]),
  ];
};

const createCodeLanguagePicker = (
  selectedLanguageId: string,
  selectedLanguageLabel = "",
  pickerId: string
) => {
  const pickerOptions = createCodeLanguagePickerOptions(
    selectedLanguageId,
    selectedLanguageLabel
  );
  const container = document.createElement("div");
  container.className = "article-code-language-picker font-ui";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "article-code-language-trigger";
  trigger.id = `${pickerId}-trigger`;
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", pickerId);
  trigger.setAttribute("aria-label", "Change code language");

  const triggerLabel = document.createElement("span");
  triggerLabel.className = "article-code-language-trigger-label";
  trigger.appendChild(triggerLabel);

  const panel = document.createElement("div");
  panel.className = "article-code-language-popover";
  panel.id = pickerId;
  panel.hidden = true;
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-labelledby", trigger.id);

  const scrollArea = document.createElement("div");
  scrollArea.className = "article-code-language-popover-scroll";
  panel.appendChild(scrollArea);

  const options = pickerOptions.map(({ id, label }, index) => {
    const option = document.createElement("div");
    option.className = "article-code-language-option";
    option.id = `${pickerId}-option-${index + 1}`;
    option.tabIndex = -1;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.dataset.languageOptionId = id;

    const optionLabel = document.createElement("span");
    optionLabel.className = "article-code-language-option-label";
    optionLabel.textContent = label;
    option.appendChild(optionLabel);

    scrollArea.appendChild(option);

    return { id, label, element: option };
  });

  container.appendChild(trigger);
  container.appendChild(panel);

  return { container, trigger, triggerLabel, panel, scrollArea, options };
};

const createCodeCopyButton = () => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "article-code-copy font-ui";
  button.setAttribute("aria-label", "Copy code block");
  button.textContent = "Copy";
  return button;
};

const createCodeBlockFromHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  const nextBlock = template.content.firstElementChild;
  return nextBlock instanceof HTMLElement ? nextBlock : null;
};

const createHighlightedCodeBlock = async (code: string, languageId: string) => {
  const nextBlock = createCodeBlockFromHtml(
    await highlightArticleCode(code, languageId)
  );
  if (!nextBlock) {
    throw new Error("Unable to render highlighted code block");
  }

  nextBlock.classList.add("astro-code");
  nextBlock.dataset.language = languageId;
  nextBlock.style.removeProperty("background-color");

  return nextBlock;
};

const replaceCodeBlock = (entry: CodeBlockEntry, nextBlock: HTMLElement) => {
  entry.block.replaceWith(nextBlock);
  entry.block = nextBlock;
};

const getCodeLanguagePickerOption = (
  entry: CodeBlockEntry,
  languageId: string
) =>
  entry.picker.options.find(option => option.id === languageId) ??
  entry.picker.options[0] ??
  null;

const syncCodeLanguagePickerSelection = (
  entry: CodeBlockEntry,
  languageId: string
) => {
  const nextOption = getCodeLanguagePickerOption(entry, languageId);
  const nextLabel =
    nextOption?.label ?? getCodeLanguagePickerLabel(languageId) ?? "";

  entry.picker.triggerLabel.textContent = nextLabel;
  setCodeLanguageLabel(entry.wrapper, languageId, nextLabel);

  entry.picker.options.forEach(option => {
    option.element.setAttribute(
      "aria-selected",
      String(option.id === languageId)
    );
  });
};

const setActiveCodeLanguagePickerOption = (
  entry: CodeBlockEntry,
  languageId: string,
  shouldFocus = false
) => {
  const nextOption = getCodeLanguagePickerOption(entry, languageId);
  if (!nextOption) return null;

  entry.picker.options.forEach(option => {
    const isActive = option.id === nextOption.id;
    option.element.dataset.active = isActive ? "true" : "false";
    option.element.tabIndex = isActive ? 0 : -1;
  });

  if (shouldFocus) {
    nextOption.element.focus({ preventScroll: true });
    nextOption.element.scrollIntoView({ block: "nearest" });
  }

  return nextOption;
};

const alignCodeLanguagePickerSelectionToTop = (
  entry: CodeBlockEntry,
  languageId: string
) => {
  const nextOption = getCodeLanguagePickerOption(entry, languageId);
  if (!nextOption) return;

  const { scrollArea } = entry.picker;
  const topInset = parseCssLength(getComputedStyle(scrollArea).paddingTop);
  const maxScrollTop = Math.max(
    0,
    scrollArea.scrollHeight - scrollArea.clientHeight
  );

  scrollArea.scrollTop = clamp(
    nextOption.element.offsetTop - topInset + 1,
    0,
    maxScrollTop
  );
};

const setCodeLanguagePickerExpanded = (
  entry: CodeBlockEntry,
  isExpanded: boolean
) => {
  entry.picker.trigger.setAttribute("aria-expanded", String(isExpanded));
  entry.picker.panel.hidden = !isExpanded;

  if (isExpanded) {
    entry.wrapper.dataset.languagePickerOpen = "true";
    return;
  }

  delete entry.wrapper.dataset.languagePickerOpen;
};

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

const mountCodeBlockController = (): Cleanup => {
  const codeBlocks = queryCodeBlocks();
  if (codeBlocks.length === 0) return () => {};

  const canCopyCodeBlocks = Boolean(navigator.clipboard?.writeText);
  const entries: CodeBlockEntry[] = [];
  const cleanups: Cleanup[] = [];
  let openPickerEntry: CodeBlockEntry | null = null;
  let pickerId = 0;

  const closeCodeLanguagePicker = (
    entry: CodeBlockEntry,
    restoreFocus = false
  ) => {
    if (openPickerEntry === entry) {
      openPickerEntry = null;
    }

    setCodeLanguagePickerExpanded(entry, false);
    setActiveCodeLanguagePickerOption(entry, entry.currentLanguageId);

    if (restoreFocus) {
      entry.picker.trigger.focus();
    }
  };

  const openCodeLanguagePicker = (
    entry: CodeBlockEntry,
    focusSelectedOption = true
  ) => {
    if (entry.picker.trigger.disabled) return;

    if (openPickerEntry && openPickerEntry !== entry) {
      closeCodeLanguagePicker(openPickerEntry);
    }

    openPickerEntry = entry;
    setCodeLanguagePickerExpanded(entry, true);
    setActiveCodeLanguagePickerOption(
      entry,
      entry.currentLanguageId,
      focusSelectedOption
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (openPickerEntry !== entry) return;
        alignCodeLanguagePickerSelectionToTop(entry, entry.currentLanguageId);
      });
    });
  };

  const stepCodeLanguagePickerOption = (
    entry: CodeBlockEntry,
    currentLanguageId: string,
    direction: 1 | -1
  ) => {
    const currentIndex = entry.picker.options.findIndex(
      option => option.id === currentLanguageId
    );
    const resolvedIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex =
      (resolvedIndex + direction + entry.picker.options.length) %
      entry.picker.options.length;
    const nextOption = entry.picker.options[nextIndex];
    if (!nextOption) return;

    setActiveCodeLanguagePickerOption(entry, nextOption.id, true);
  };

  const pickFirstCodeLanguageOption = (entry: CodeBlockEntry) => {
    const nextOption = entry.picker.options[0];
    if (!nextOption) return;

    setActiveCodeLanguagePickerOption(entry, nextOption.id, true);
  };

  const pickLastCodeLanguageOption = (entry: CodeBlockEntry) => {
    const nextOption = entry.picker.options.at(-1);
    if (!nextOption) return;

    setActiveCodeLanguagePickerOption(entry, nextOption.id, true);
  };

  const handleDocumentPointerDown = (event: PointerEvent) => {
    if (!openPickerEntry) return;

    const target = event.target;
    if (target instanceof Node && openPickerEntry.wrapper.contains(target)) {
      return;
    }

    closeCodeLanguagePicker(openPickerEntry);
  };

  document.addEventListener("pointerdown", handleDocumentPointerDown);

  codeBlocks.forEach(block => {
    const sourceText = getCodeBlockText(block);
    if (!sourceText.trim()) return;

    const wrapped = ensureCodeBlockWrapper(block);
    if (!wrapped) return;

    const { wrapper, preserveWrapper } = wrapped;
    wrapper.dataset.languagePickerAttached = "true";
    const declaredLanguageLabel = getCodeLanguageLabel(block);
    const declaredLanguageId = getDeclaredCodeLanguage(block);
    const normalizedDeclaredLanguageId =
      resolveCodeLanguageId(declaredLanguageId) ||
      declaredLanguageId.trim().toLowerCase();
    const resolvedPickerLanguageId =
      resolveCodeLanguagePickerId(declaredLanguageId);
    const defaultLanguageId =
      resolvedPickerLanguageId === "plaintext" && normalizedDeclaredLanguageId
        ? normalizedDeclaredLanguageId
        : resolvedPickerLanguageId;
    const picker = createCodeLanguagePicker(
      defaultLanguageId,
      declaredLanguageLabel,
      `article-code-language-picker-${++pickerId}`
    );
    setCodeLanguageLabel(wrapper, defaultLanguageId, declaredLanguageLabel);
    const button = canCopyCodeBlocks ? createCodeCopyButton() : null;

    wrapper.appendChild(picker.container);
    if (button) {
      wrapper.appendChild(button);
    }

    entries.push({
      wrapper,
      preserveWrapper,
      button,
      picker,
      block,
      sourceText,
      defaultLanguageId,
      currentLanguageId: defaultLanguageId,
      defaultMarkup: block.outerHTML,
    });
  });

  entries.forEach(entry => {
    const { wrapper, button, picker } = entry;
    let resetTimeoutId = 0;

    syncCodeLanguagePickerSelection(entry, entry.currentLanguageId);
    setActiveCodeLanguagePickerOption(entry, entry.currentLanguageId);

    const resetButtonState = () => {
      if (!button) return;
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
      if (!button) return;
      if (openPickerEntry === entry) {
        closeCodeLanguagePicker(entry);
      }

      button.setAttribute("disabled", "true");

      try {
        await copyTextToClipboard(entry.sourceText);
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

    const handleLanguageSelection = async (nextLanguageId: string) => {
      if (nextLanguageId === entry.currentLanguageId) {
        closeCodeLanguagePicker(entry, true);
        return;
      }

      const previousLanguageId = entry.currentLanguageId;
      closeCodeLanguagePicker(entry);
      entry.currentLanguageId = nextLanguageId;
      syncCodeLanguagePickerSelection(entry, nextLanguageId);
      setActiveCodeLanguagePickerOption(entry, nextLanguageId);

      picker.trigger.disabled = true;
      wrapper.dataset.languagePickerState = "loading";

      try {
        const nextBlock =
          nextLanguageId === entry.defaultLanguageId
            ? createCodeBlockFromHtml(entry.defaultMarkup)
            : await createHighlightedCodeBlock(
                entry.sourceText,
                nextLanguageId
              );

        if (!nextBlock) {
          throw new Error("Unable to create next code block state");
        }

        replaceCodeBlock(entry, nextBlock);
      } catch {
        entry.currentLanguageId = previousLanguageId;
        syncCodeLanguagePickerSelection(entry, previousLanguageId);
        setActiveCodeLanguagePickerOption(entry, previousLanguageId);
      } finally {
        delete wrapper.dataset.languagePickerState;
        picker.trigger.disabled = false;
        picker.trigger.focus();
      }
    };

    const handleTriggerClick = () => {
      if (openPickerEntry === entry) {
        closeCodeLanguagePicker(entry);
        return;
      }

      openCodeLanguagePicker(entry);
    };

    const handleTriggerKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown") return;

      event.preventDefault();
      openCodeLanguagePicker(entry);
    };

    const handleWrapperFocusOut = (event: FocusEvent) => {
      if (openPickerEntry !== entry) return;

      const relatedTarget = event.relatedTarget;
      if (relatedTarget instanceof Node && wrapper.contains(relatedTarget)) {
        return;
      }

      closeCodeLanguagePicker(entry);
    };

    const optionCleanups = picker.options.map(option => {
      const handleOptionClick = () => {
        void handleLanguageSelection(option.id);
      };

      const handleOptionFocus = () => {
        setActiveCodeLanguagePickerOption(entry, option.id);
      };

      const handleOptionKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          stepCodeLanguagePickerOption(entry, option.id, 1);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          stepCodeLanguagePickerOption(entry, option.id, -1);
          return;
        }

        if (event.key === "Home") {
          event.preventDefault();
          pickFirstCodeLanguageOption(entry);
          return;
        }

        if (event.key === "End") {
          event.preventDefault();
          pickLastCodeLanguageOption(entry);
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeCodeLanguagePicker(entry, true);
          return;
        }

        if (event.key === "Tab") {
          closeCodeLanguagePicker(entry);
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void handleLanguageSelection(option.id);
        }
      };

      option.element.addEventListener("click", handleOptionClick);
      option.element.addEventListener("focus", handleOptionFocus);
      option.element.addEventListener("keydown", handleOptionKeyDown);

      return () => {
        option.element.removeEventListener("click", handleOptionClick);
        option.element.removeEventListener("focus", handleOptionFocus);
        option.element.removeEventListener("keydown", handleOptionKeyDown);
      };
    });

    if (button) {
      button.addEventListener("click", handleClick);
    }
    picker.trigger.addEventListener("click", handleTriggerClick);
    picker.trigger.addEventListener("keydown", handleTriggerKeyDown);
    wrapper.addEventListener("focusout", handleWrapperFocusOut);

    cleanups.push(() => {
      if (button) {
        button.removeEventListener("click", handleClick);
      }
      picker.trigger.removeEventListener("click", handleTriggerClick);
      picker.trigger.removeEventListener("keydown", handleTriggerKeyDown);
      wrapper.removeEventListener("focusout", handleWrapperFocusOut);
      optionCleanups.forEach(cleanup => cleanup());
      if (resetTimeoutId) window.clearTimeout(resetTimeoutId);
      if (openPickerEntry === entry) {
        openPickerEntry = null;
      }
      delete wrapper.dataset.languagePickerAttached;
      delete wrapper.dataset.languagePickerOpen;
      delete wrapper.dataset.languagePickerState;
      wrapper.dataset.copyState = "idle";

      if (entry.preserveWrapper) {
        picker.container.remove();
        button?.remove();
        return;
      }

      const hostParent = wrapper.parentElement;
      if (!hostParent) return;

      hostParent.insertBefore(entry.block, wrapper);
      wrapper.remove();
    });
  });

  return () => {
    document.removeEventListener("pointerdown", handleDocumentPointerDown);
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
        window.scrollY +
          entry.heading.getBoundingClientRect().top -
          getHeadingOffset()
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
    mountCodeBlockController(),
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
