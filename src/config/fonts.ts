export type SiteFontRole = "ui" | "body" | "display";
export type SiteFontCssVariable =
  | "--font-ui-source"
  | "--font-body-source"
  | "--font-display-source";
export type SiteFontStyle = "normal" | "italic";

type SiteFontDefinition = {
  role: SiteFontRole;
  name: string;
  cssVariable: SiteFontCssVariable;
  fallbacks: readonly [string, ...string[]];
  weights: readonly [number, ...number[]];
  styles: readonly [SiteFontStyle, ...SiteFontStyle[]];
  preload: boolean;
};

export const FONT_FAMILIES = [
  {
    role: "ui",
    name: "Inter",
    cssVariable: "--font-ui-source",
    fallbacks: ["sans-serif"],
    weights: [400, 500],
    styles: ["normal"],
    preload: true,
  },
  {
    role: "body",
    name: "Source Serif 4",
    cssVariable: "--font-body-source",
    fallbacks: ["serif"],
    weights: [400, 600],
    styles: ["normal", "italic"],
    preload: true,
  },
  {
    role: "display",
    name: "Playfair Display",
    cssVariable: "--font-display-source",
    fallbacks: ["serif"],
    weights: [400, 600],
    styles: ["normal", "italic"],
    preload: false,
  },
] as const satisfies readonly SiteFontDefinition[];
