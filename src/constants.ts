import { SITE } from "@/config";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
}

export const SOCIALS: Social[] = [
  {
    name: "GitHub",
    href: "https://github.com/ecattea",
    linkTitle: `${SITE.title} on GitHub`,
  },
];
