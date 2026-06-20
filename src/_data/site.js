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

  // The CODE repo — drives "submit a sighting" links and the issue pipeline.
  repo: "aislopwatch/web",

  author: {
    name: "The Slop Desk",
    email: "",
  },

  // Comments via giscus (GitHub Discussions) in a SEPARATE public repo, so the
  // code repo can stay private. Set up once:
  //   1. the comments repo must be PUBLIC, with Discussions enabled
  //   2. install the giscus app on it
  //   3. go to https://giscus.app/, enter aislopwatch/aislopwatch-comments,
  //      copy repoId + categoryId into the placeholders below, set enabled: true
  comments: {
    enabled: false,
    repo: "aislopwatch/aislopwatch-comments",
    repoId: "REPLACE_WITH_GISCUS_REPO_ID",
    category: "Announcements",
    categoryId: "REPLACE_WITH_GISCUS_CATEGORY_ID",
  },
};
