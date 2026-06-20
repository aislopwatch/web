// Pure logic: turn a "slop sighting" issue into a Markdown post.
// Kept dependency-free and side-effect-free so it can be unit-tested and
// required from the publish-from-issues workflow (actions/github-script).

const CATEGORY_MAP = {
  "Slop (machine-written)": "slop",
  "Hype (a human posting about AI)": "hype",
  Guide: "guides",
  Tell: "tells",
  Meta: "meta",
};

function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled"
  );
}

// Extract one section of a GitHub issue-form body ("### Label\n\n<value>").
function section(body, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = (body || "").match(
    new RegExp("###\\s+" + esc + "\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)")
  );
  let v = m ? m[1].trim() : "";
  if (v === "_No response_") v = "";
  return v;
}

function yamlStr(s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

// The post body comes from an untrusted issue and is rendered by markdown-it
// with html:true, so raw HTML would pass straight through (stored XSS). Markdown
// itself stays intact — we only neutralize the "<" that begins an HTML tag,
// comment, or CDATA (markdown-it's own rule: "<" followed by a letter, "/",
// "!", or "?"). Everything else (links, images, **bold**, code) is untouched.
// markdown-it's default validateLink already blocks javascript:/vbscript: URLs.
function neutralizeHtml(s) {
  return String(s).replace(/<(?=[a-zA-Z/!?])/g, "&lt;");
}

// GitHub sometimes emits a pasted screenshot as a raw <img> tag. We must keep
// the image but can't allow raw HTML (XSS), so convert <img> to Markdown FIRST
// (extracting only src+alt); neutralizeHtml then escapes any other HTML, and
// markdown-it's validateLink rejects dangerous src schemes. Tags without a src
// are dropped.
function imgToMarkdown(s) {
  return String(s).replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i) || [])[2] || "";
    const alt = (tag.match(/\balt\s*=\s*(["'])(.*?)\1/i) || [])[2] || "";
    return src ? `![${alt}](${src})` : "";
  });
}

// Rewrite remote image URLs in Markdown to co-located local paths and return
// the list to download. Self-hosting makes screenshots tamper-proof and immune
// to GitHub's expiring signed CDN links. The actual fetching happens in the
// publish workflow (this stays pure/side-effect-free for testing).
function localizeImages(markdown) {
  const images = [];
  let i = 0;
  const md = String(markdown).replace(
    /(!\[[^\]]*\]\()\s*(https?:\/\/[^)\s]+?)\s*(\))/gi,
    (m, pre, url, post) => {
      i += 1;
      const file = "images/sighting" + (i === 1 ? "" : "-" + i) + ".png";
      images.push({ url, file });
      return pre + file + post;
    }
  );
  return { markdown: md, images };
}

// Give every screenshot meaningful alt text — fall back to the post title when
// the submitter left it blank or as GitHub's default "Image".
function ensureAltText(s, title) {
  const t = String(title).replace(/[[\]]/g, "");
  return String(s).replace(
    /!\[\s*(image)?\s*\]\(/gi,
    `![Screenshot: ${t}](`
  );
}

function deriveDescription(text, fallback) {
  const line =
    (text || "")
      .split("\n")
      .map((l) => l.trim())
      .find(
        (l) => l && !l.startsWith("![") && !l.startsWith("<") && !l.startsWith("|")
      ) ||
    fallback ||
    "";
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .trim()
    .slice(0, 150);
}

// issue: { title, body, user: {login, html_url} }
// returns { slug, dir, filename, content, tag }
function buildPost({ issue, id, approved, up, date }) {
  const title = (issue.title || "").replace(/^\[sighting\]\s*/i, "").trim() || "untitled";
  const body = issue.body || "";
  const localized = localizeImages(
    ensureAltText(
      neutralizeHtml(
        imgToMarkdown(section(body, "The sighting") || body || "(no description provided)")
      ),
      title
    )
  );
  const sighting = localized.markdown;
  const tag = CATEGORY_MAP[section(body, "Category")] || "sightings";
  const pad = String(id).padStart(3, "0");
  const slug = pad + "-" + slugify(title);
  const desc = deriveDescription(sighting, title);
  const user = issue.user || {};
  const credit =
    "*Suggested by [@" +
    (user.login || "anon") +
    "](" +
    (user.html_url || "#") +
    ")" +
    (approved
      ? " · approved by the editor.*"
      : " · published by community vote (" + up + " 👍).*");
  const content =
    "---\n" +
    "id: " + id + "\n" +
    "title: " + yamlStr(title) + "\n" +
    "date: " + date + "\n" +
    "description: " + yamlStr(desc) + "\n" +
    "tags:\n  - " + tag + "\n" +
    "---\n\n" +
    sighting.trim() +
    "\n\n---\n\n" +
    credit +
    "\n";
  return {
    slug,
    dir: "src/posts/" + slug,
    filename: "src/posts/" + slug + "/index.md",
    content,
    tag,
    images: localized.images,
  };
}

module.exports = { CATEGORY_MAP, slugify, section, deriveDescription, neutralizeHtml, imgToMarkdown, ensureAltText, localizeImages, buildPost };
