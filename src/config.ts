export const SITE = {
  website: "https://ecattea.com/", // replace this with your deployed domain
  author: "Ecattea",
  profile: "https://github.com/ecattea",
  desc: "Ecattea's personal blog.",
  title: "Ecattea's Blog",
  ogImage: "",
  lightAndDarkMode: false,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: false, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/ecattea/Blog/edit/master/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en-us", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Singapore", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
