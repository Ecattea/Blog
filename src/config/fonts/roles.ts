import type { FontSourceId } from "./sources";

export type FontRole = "ui" | "heading" | "body";
export type FontRoleCssVariable =
  | "--font-family-ui"
  | "--font-family-heading"
  | "--font-family-body";

export const FONT_ROLE_TO_SOURCE = {
  ui: "karla",
  heading: "spectral",
  body: "spectral",
} as const satisfies Record<FontRole, FontSourceId>;

export const FONT_ROLE_CSS_VARIABLES = {
  ui: "--font-family-ui",
  heading: "--font-family-heading",
  body: "--font-family-body",
} as const satisfies Record<FontRole, FontRoleCssVariable>;
