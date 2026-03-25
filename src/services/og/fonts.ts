import type { Font, FontStyle, FontWeight } from "satori";
import type { FontRole } from "@/config/fonts";
import { FONT_ROLE_FAMILY_NAMES, OG_FONT_ROLE_REQUESTS } from "@/config/fonts";

type OgFontRequest = (typeof OG_FONT_ROLE_REQUESTS)[FontRole];

function getGoogleFontApiUrl(
  font: OgFontRequest,
  text: string,
  weight: FontWeight,
  style: FontStyle
) {
  const axis = style === "italic" ? `ital,wght@1,${weight}` : `wght@${weight}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.googleFamily)}:${axis}&text=${encodeURIComponent(text)}`;
}

async function loadGoogleFont(
  font: OgFontRequest,
  text: string,
  weight: FontWeight,
  style: FontStyle
): Promise<ArrayBuffer> {
  const API = getGoogleFontApiUrl(font, text, weight, style);

  const css = await (
    await fetch(API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    })
  ).text();

  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/
  );

  if (!resource) throw new Error("Failed to download dynamic font");

  const res = await fetch(resource[1]);

  if (!res.ok) {
    throw new Error("Failed to download dynamic font. Status: " + res.status);
  }

  return res.arrayBuffer();
}

export async function loadOgFonts(
  text: string,
  roles: readonly FontRole[]
): Promise<Font[]> {
  const fontVariants = new Map<
    string,
    { font: OgFontRequest; weight: FontWeight; style: FontStyle }
  >();

  roles.forEach(role => {
    const font = OG_FONT_ROLE_REQUESTS[role];

    font.weights.forEach(weight => {
      font.styles.forEach(style => {
        fontVariants.set(`${font.id}:${weight}:${style}`, {
          font,
          weight: weight as FontWeight,
          style,
        });
      });
    });
  });

  return Promise.all(
    [...fontVariants.values()].map(async ({ font, weight, style }) => {
      const data = await loadGoogleFont(font, text, weight, style);
      return { name: font.name, data, weight, style };
    })
  );
}

export const OG_FONT_FAMILIES = FONT_ROLE_FAMILY_NAMES;
