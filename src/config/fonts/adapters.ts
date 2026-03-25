import {
  FONT_ROLE_CSS_VARIABLES,
  FONT_ROLE_TO_SOURCE,
  type FontRole,
} from "./roles";
import {
  FONT_SOURCES,
  type FontProviderName,
  type FontSourceCssVariable,
  type FontSourceDefinition,
  type FontSourceId,
  type FontStyle,
  type FontTarget,
} from "./sources";

export type AstroFontRegistration = Pick<
  FontSourceDefinition,
  "name" | "provider" | "cssVariable" | "fallbacks" | "weights" | "styles"
>;

export type LayoutFontInjection = Pick<
  FontSourceDefinition,
  "cssVariable" | "preload"
>;

export type LayoutFontRoleDeclaration = {
  cssVariable: (typeof FONT_ROLE_CSS_VARIABLES)[FontRole];
  sourceCssVariable: FontSourceCssVariable;
};

export type OgFontRequestDescriptor = Pick<
  FontSourceDefinition,
  "id" | "provider" | "name" | "googleFamily"
> & {
  weights: readonly [number, ...number[]];
  styles: readonly [FontStyle, ...FontStyle[]];
};

const FONT_SOURCE_LIST = Object.values(FONT_SOURCES);
const FONT_ROLES = Object.keys(FONT_ROLE_TO_SOURCE) as FontRole[];

function toNonEmptyTuple<T>(items: readonly T[]): readonly [T, ...T[]] {
  return [items[0], ...items.slice(1)];
}

function getSourcesForTarget(
  target: FontTarget
): readonly FontSourceDefinition[] {
  return FONT_SOURCE_LIST.filter(source => source.targets.includes(target));
}

function pickOgWeights(
  weights: readonly number[]
): readonly [number, ...number[]] {
  const preferred = weights.filter(weight => weight === 400 || weight === 600);
  return toNonEmptyTuple(preferred.length > 0 ? preferred : weights);
}

function pickOgStyles(
  styles: readonly FontStyle[]
): readonly [FontStyle, ...FontStyle[]] {
  return styles.includes("normal") ? ["normal"] : toNonEmptyTuple(styles);
}

function toOgFontRequest(
  source: FontSourceDefinition
): OgFontRequestDescriptor {
  return {
    id: source.id,
    provider: source.provider,
    name: source.name,
    googleFamily: source.googleFamily,
    weights: pickOgWeights(source.weights),
    styles: pickOgStyles(source.styles),
  };
}

export const ASTRO_FONT_REGISTRATIONS = getSourcesForTarget("web").map(
  source => ({
    name: source.name,
    provider: source.provider,
    cssVariable: source.cssVariable,
    fallbacks: source.fallbacks,
    weights: source.weights,
    styles: source.styles,
  })
) satisfies readonly AstroFontRegistration[];

export const LAYOUT_FONT_INJECTIONS = getSourcesForTarget("web").map(
  source => ({
    cssVariable: source.cssVariable,
    preload: source.preload,
  })
) satisfies readonly LayoutFontInjection[];

export const LAYOUT_FONT_ROLE_DECLARATIONS = FONT_ROLES.map(role => ({
  cssVariable: FONT_ROLE_CSS_VARIABLES[role],
  sourceCssVariable: FONT_SOURCES[FONT_ROLE_TO_SOURCE[role]].cssVariable,
})) satisfies readonly LayoutFontRoleDeclaration[];

export const FONT_ROLE_FAMILY_NAMES = {
  ui: FONT_SOURCES[FONT_ROLE_TO_SOURCE.ui].name,
  heading: FONT_SOURCES[FONT_ROLE_TO_SOURCE.heading].name,
  body: FONT_SOURCES[FONT_ROLE_TO_SOURCE.body].name,
} as const satisfies Record<FontRole, string>;

export const OG_FONT_ROLE_REQUESTS = {
  ui: toOgFontRequest(FONT_SOURCES[FONT_ROLE_TO_SOURCE.ui]),
  heading: toOgFontRequest(FONT_SOURCES[FONT_ROLE_TO_SOURCE.heading]),
  body: toOgFontRequest(FONT_SOURCES[FONT_ROLE_TO_SOURCE.body]),
} as const satisfies Record<FontRole, OgFontRequestDescriptor>;

export function resolveFontProviderName(provider: FontProviderName) {
  switch (provider) {
    case "google":
      return provider;
  }
}

export function getFontSourceById(id: FontSourceId) {
  return FONT_SOURCES[id];
}
