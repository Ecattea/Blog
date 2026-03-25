export type {
  AstroFontRegistration,
  LayoutFontInjection,
  LayoutFontRoleDeclaration,
  OgFontRequestDescriptor,
} from "./fonts/adapters";
export {
  ASTRO_FONT_REGISTRATIONS,
  FONT_ROLE_FAMILY_NAMES,
  LAYOUT_FONT_INJECTIONS,
  LAYOUT_FONT_ROLE_DECLARATIONS,
  OG_FONT_ROLE_REQUESTS,
  getFontSourceById,
  resolveFontProviderName,
} from "./fonts/adapters";
export type { FontRole, FontRoleCssVariable } from "./fonts/roles";
export { FONT_ROLE_CSS_VARIABLES, FONT_ROLE_TO_SOURCE } from "./fonts/roles";
export type {
  FontProviderName,
  FontSourceCssVariable,
  FontSourceDefinition,
  FontSourceId,
  FontStyle,
  FontTarget,
} from "./fonts/sources";
export { FONT_SOURCES } from "./fonts/sources";
