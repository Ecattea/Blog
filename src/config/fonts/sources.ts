export type FontProviderName = "google";
export type FontTarget = "web" | "og";
export type FontSourceId = "karla" | "spectral";
export type FontSourceCssVariable =
  | "--font-source-karla"
  | "--font-source-spectral";
export type FontStyle = "normal" | "italic";

export type FontSourceDefinition = {
  id: FontSourceId;
  provider: FontProviderName;
  name: string;
  googleFamily: string;
  cssVariable: FontSourceCssVariable;
  fallbacks: readonly [string, ...string[]];
  weights: readonly [number, ...number[]];
  styles: readonly [FontStyle, ...FontStyle[]];
  preload: boolean;
  targets: readonly [FontTarget, ...FontTarget[]];
};

export const FONT_SOURCES = {
  karla: {
    id: "karla",
    provider: "google",
    name: "Karla",
    googleFamily: "Karla",
    cssVariable: "--font-source-karla",
    fallbacks: ["sans-serif"],
    weights: [400, 500, 600],
    styles: ["normal"],
    preload: true,
    targets: ["web", "og"],
  },
  spectral: {
    id: "spectral",
    provider: "google",
    name: "Spectral",
    googleFamily: "Spectral",
    cssVariable: "--font-source-spectral",
    fallbacks: ["serif"],
    weights: [400, 500, 600],
    styles: ["normal", "italic"],
    preload: true,
    targets: ["web", "og"],
  },
} as const satisfies Record<FontSourceId, FontSourceDefinition>;
