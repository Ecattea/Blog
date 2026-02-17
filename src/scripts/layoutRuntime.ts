type NavContext = {
  from: string;
  to: string;
};

const PERF_NAV_STORAGE_KEY = "perfNav";

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

function applyTilt(
  card: HTMLElement,
  clientX: number,
  clientY: number,
  maxRotate: number,
  scale: number,
  perspectiveVal: number
): void {
  const glare = card.querySelector<HTMLElement>(".tilt-glare");
  const rect = card.getBoundingClientRect();

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const percentX = (x - centerX) / centerX;
  const percentY = (y - centerY) / centerY;

  const rotateX = percentY * -maxRotate;
  const rotateY = percentX * maxRotate;

  card.style.transform = `
    perspective(${perspectiveVal}px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
    scale3d(${scale}, ${scale}, ${scale})
  `;

  if (!glare) return;

  const glareX = 50 + percentX * 20;
  const glareY = 50 + percentY * 20;
  glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 80%)`;
  glare.style.opacity = "1";
}

function resetTilt(card: HTMLElement, perspectiveVal = 1000): void {
  const glare = card.querySelector<HTMLElement>(".tilt-glare");
  card.style.transform = `perspective(${perspectiveVal}px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  if (glare) glare.style.opacity = "0";
}

function attachTiltHandlers(): void {
  if (!window.matchMedia?.("(hover: hover)")?.matches) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

  document.querySelectorAll<HTMLElement>(".tilt-card").forEach(card => {
    if (card.dataset.tiltAttached === "1") return;
    card.dataset.tiltAttached = "1";

    card.addEventListener("mousemove", e => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      requestAnimationFrame(() =>
        applyTilt(card, clientX, clientY, 4, 1.01, 1000)
      );
    });

    card.addEventListener("mouseleave", () => {
      resetTilt(card, 1000);
    });
  });

  const dock = document.querySelector<HTMLElement>(".tilt-dock");
  if (!dock) return;
  if (dock.dataset.tiltDockAttached === "1") return;
  dock.dataset.tiltDockAttached = "1";

  dock.addEventListener("mousemove", e => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    requestAnimationFrame(() => applyTilt(dock, clientX, clientY, 3.5, 1.0, 500));
  });

  dock.addEventListener("mouseleave", () => {
    resetTilt(dock, 500);
  });
}

function attachDockPerfHandlers(
  perfNavEnabled: boolean,
  setNavContext: (context: NavContext | null) => void
): void {
  if (!perfNavEnabled) return;

  const dock = document.querySelector<HTMLElement>(".dock-wrapper");
  if (!dock) return;

  dock.querySelectorAll<HTMLAnchorElement>("a.dock-link").forEach(link => {
    if (link.dataset.perfNavAttached === "1") return;
    link.dataset.perfNavAttached = "1";

    link.addEventListener(
      "click",
      () => {
        const to = normalizePathname(new URL(link.href).pathname);
        const from = normalizePathname(window.location.pathname);
        if (to === from) return;

        setNavContext({ from, to });
        performance.clearMarks("nav:start");
        performance.clearMarks("nav:end");
        performance.clearMeasures("nav:duration");
        performance.mark("nav:start");
        // eslint-disable-next-line no-console
        console.log(`[perfNav] start ${from} -> ${to}`);
      },
      { capture: true }
    );
  });
}

function markNavEnd(
  perfNavEnabled: boolean,
  getNavContext: () => NavContext | null,
  setNavContext: (context: NavContext | null) => void
): void {
  if (!perfNavEnabled) return;

  const navContext = getNavContext();
  if (!navContext) return;

  performance.mark("nav:end");
  performance.measure("nav:duration", "nav:start", "nav:end");
  const entries = performance.getEntriesByName("nav:duration");
  const last = entries[entries.length - 1];
  const duration = last ? Math.round(last.duration) : null;
  // eslint-disable-next-line no-console
  console.log(`[perfNav] end ${navContext.from} -> ${navContext.to} (${duration}ms)`);
  setNavContext(null);
}

export function initLayoutRuntime(): void {
  const isDev = import.meta.env.DEV;

  if (!isDev && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // no-op
      });
    });
  }

  document.addEventListener("astro:after-swap", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });

  const perfNavEnabled = (() => {
    try {
      return localStorage.getItem(PERF_NAV_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  })();

  let navContext: NavContext | null = null;
  const getNavContext = () => navContext;
  const setNavContext = (context: NavContext | null) => {
    navContext = context;
  };

  attachDockPerfHandlers(perfNavEnabled, setNavContext);
  attachTiltHandlers();

  document.addEventListener("astro:after-swap", () => {
    attachDockPerfHandlers(perfNavEnabled, setNavContext);
    attachTiltHandlers();
    markNavEnd(perfNavEnabled, getNavContext, setNavContext);
  });
}
