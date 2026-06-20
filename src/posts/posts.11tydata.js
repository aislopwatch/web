// Shared front matter for every post in this folder.
export default {
  layout: "post.njk",
  tags: ["posts"],
  // Drives og:type=article + the BlogPosting/Breadcrumb JSON-LD in base.njk.
  ogType: "article",
  // SECURITY: render post bodies as Markdown ONLY — never run Nunjucks on them.
  // Post bodies can come from untrusted community issue submissions, and the
  // site-wide markdownTemplateEngine ("njk") would otherwise execute `{{…}}` /
  // `{%…%}` in that content at build time (SSTI in the privileged CI job).
  // Trusted layouts/shortcodes still run njk; only the post *body* is plain md.
  templateEngineOverride: "md",
};

// URL + numbering convention
// -----------------------------------------------------------------------------
// Name each post folder (or file) with a zero-padded id prefix, and set the
// matching `id` in its front matter:
//
//   src/posts/001-hello-world/index.md   with   id: 1
//
// The folder name becomes the URL (/posts/001-hello-world/), so the id is
// always in the link and two posts may share a slug (001-hello, 007-hello).
// Co-located images keep working because the image folder and the page share
// the same path. The front-matter `id` is what renders as the index number.
//
// Lock a single post's comments by adding `comments: false` to its front
// matter. Comments otherwise follow the global switch in _data/site.js.
