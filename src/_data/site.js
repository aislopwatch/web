// Site-wide settings. Edit these.
export default {
  title: "AISlopWatch",
  tagline: "AI slop and AI hype — screenshotted, labeled, and blamed.",
  description:
    "AISlopWatch logs two species of AI cringe: the low-effort content machines extrude and nobody reads, and the wide-awake humans posting that AI is sentient, about to make them rich, and the only thing that matters now. We screenshot it and assign blame.",

  // Origin only (no trailing slash). Served at the root of the custom domain
  // aislopwatch.com (see src/static/CNAME). Used for RSS + sitemap + absolute
  // OG image url. Can be overridden in CI via SITE_URL for a preview deploy.
  url: process.env.SITE_URL || "https://aislopwatch.com",

  // The public repo — drives "submit a sighting" links (Issues), the issue
  // pipeline, and giscus comments (Discussions). Public, but anonymous.
  repo: "aislopwatch/web",

  // Private contact for corrections / takedown requests. Set up as a Cloudflare
  // Email Routing alias that forwards to your inbox (keeps it off your name).
  contact: "removals@aislopwatch.com",

  author: {
    name: "The Slop Desk",
    email: "",
  },

  // Comments via giscus (GitHub Discussions) in this same public repo. Set up
  // once, then flip enabled:true:
  //   1. enable the Discussions feature on aislopwatch/web
  //   2. install the giscus app (https://github.com/apps/giscus) on it
  //   3. go to https://giscus.app/, enter aislopwatch/web, mapping = pathname,
  //      copy repoId + categoryId into the placeholders below
  comments: {
    enabled: true,
    repo: "aislopwatch/web",
    repoId: "R_kgDOTAJhAw",
    category: "Announcements",
    categoryId: "DIC_kwDOTAJhA84DACaS",
  },
};
