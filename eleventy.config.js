// Eleventy configuration. Kept deliberately small.
// Docs: https://www.11ty.dev/docs/

import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownItFootnote from "markdown-it-footnote";
import markdownItTaskLists from "markdown-it-task-lists";

export default function (eleventyConfig) {
  // --- Plugins ------------------------------------------------------------
  // Build-time syntax highlighting (Prism). Emits token <span>s, no client JS.
  // Colors live in css/style.css under ".token.*".
  eleventyConfig.addPlugin(syntaxHighlight);

  // --- Static files -------------------------------------------------------
  // Co-located post images: drop images next to a post and reference them
  // with a RELATIVE path, e.g.  ![alt](images/foo.jpg)
  eleventyConfig.addPassthroughCopy(
    "src/posts/**/*.{jpg,jpeg,png,gif,webp,svg,avif}"
  );
  // Anything in src/static/ is copied to the site root (favicon, etc.)
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  // Stylesheet: src/css/style.css -> public/css/style.css
  eleventyConfig.addPassthroughCopy("src/css");

  // --- Markdown -----------------------------------------------------------
  // Tweak the built-in markdown-it instance. Tables and strikethrough ship
  // with markdown-it's default preset; footnotes and task lists are plugins.
  // typographer:false  -> markdown NEVER auto-converts -- or ... into dashes.
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ html: true, linkify: true, typographer: false });
    md.use(markdownItFootnote);
    md.use(markdownItTaskLists, { enabled: true, label: true });
  });

  // --- Image loading transform -------------------------------------------
  // Uniformly handle every <img> in the output (markdown ![]() AND raw <img>
  // pasted from GitHub): the FIRST image on a page is the likely LCP element so
  // it loads eagerly with high priority; the rest lazy-load. All decode async.
  eleventyConfig.addTransform("imgLoading", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    let n = 0;
    return content.replace(/<img\b[^>]*>/gi, (tag) => {
      n += 1;
      let t = tag
        .replace(/\s+loading=(?:"[^"]*"|'[^']*'|\S+)/i, "")
        .replace(/\s+fetchpriority=(?:"[^"]*"|'[^']*'|\S+)/i, "");
      if (!/\bdecoding=/i.test(t)) t = t.replace(/<img\b/i, '<img decoding="async"');
      t =
        n === 1
          ? t.replace(/<img\b/i, '<img loading="eager" fetchpriority="high"')
          : t.replace(/<img\b/i, '<img loading="lazy"');
      return t;
    });
  });

  // --- Filters ------------------------------------------------------------
  eleventyConfig.addFilter("readableDate", (dateObj) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(dateObj))
  );

  eleventyConfig.addFilter("htmlDateString", (dateObj) =>
    new Date(dateObj).toISOString().slice(0, 10)
  );

  // RFC-822-ish date for RSS pubDate
  eleventyConfig.addFilter("rssDate", (dateObj) =>
    new Date(dateObj).toUTCString()
  );

  // Zero-pad the post index: 1 -> "001"
  eleventyConfig.addFilter("pad", (n) => String(n).padStart(3, "0"));

  // First real tag of a post (skips the internal "posts" tag). Drives the
  // verdict badge; pairs with the categories map in _data/categories.js.
  eleventyConfig.addFilter(
    "primaryCategory",
    (tags) => (tags || []).find((t) => t !== "posts") || null
  );

  // Up to `limit` other posts sharing a tag (newest first), excluding the
  // current one. Drives the "more slop" related block.
  eleventyConfig.addFilter("relatedPosts", (posts, currentUrl, limit) =>
    [...(posts || [])]
      .reverse()
      .filter((p) => p.url !== currentUrl)
      .slice(0, limit || 3)
  );


  // --- Engagement / "Hall of Shame" --------------------------------------
  // Join the posts collection with the build-time engagement data (written by
  // the refresh-engagement workflow into src/_data/engagement.json) and sort by
  // score, newest as the tiebreak. Score = 👍 + 2×comments + other reactions.
  // Works with zero data (everything scores 0, falls back to date order).
  eleventyConfig.addFilter("rankByEngagement", (posts, engagement) => {
    const bySlug = {};
    ((engagement && engagement.posts) || []).forEach((e) => {
      bySlug[e.slug] = e;
    });
    return [...(posts || [])]
      .map((post) => {
        const e = bySlug[post.fileSlug] || {};
        return {
          post,
          up: e.up || 0,
          comments: e.comments || 0,
          reactions: e.reactions || 0,
          score: e.score || 0,
        };
      })
      .sort(
        (a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date)
      );
  });

  // --- Shortcodes ---------------------------------------------------------
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // --- Collections --------------------------------------------------------
  // All tags actually used by posts, minus the internal "posts" tag. Drives
  // the filter bar and the per-tag pages (/tags/<tag>/).
  eleventyConfig.addCollection("tagList", (collection) => {
    const tags = new Set();
    collection.getAll().forEach((item) => {
      (item.data.tags || []).forEach((t) => {
        if (t !== "posts") tags.add(t);
      });
    });
    return [...tags].sort();
  });

  // --- Config -------------------------------------------------------------
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      // GitHub Pages serves whatever ends up in "public/"
      output: "public",
    },
    // Served at the root of the custom domain aislopwatch.com, so PATH_PREFIX
    // is unset and this defaults to "/". (For a GitHub project page under a
    // subpath, CI would set PATH_PREFIX="/reponame/".)
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
}
