# AISlopWatch

A small, nerdy, statically generated blog for blaming AI slop.
Markdown posts, co-located images, RSS, zero tracking. Built with
[Eleventy](https://www.11ty.dev/) and deployed on Cloudflare Pages.

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install
npm start
```

Open http://localhost:8080. The dev server live-reloads on save.

Build the production site into `public/`:

```bash
npm run build
```

## Project layout

```
.github/workflows/         # publish-from-issues + refresh-engagement (commit only)
functions/api/             # Cloudflare Pages Functions (live views/blame, D1)
src/
  _data/site.js        # title, url, author, comments config  <- EDIT THIS
  _includes/           # layouts (base.njk, post.njk, comments.njk)
  css/style.css        # all styling (incl. syntax colors under .token.*)
  static/              # files copied to the site root
    favicon.svg
    og.png             # 1200x630 Open Graph image
    og.svg             # source for og.png
  index.njk            # homepage (auto-lists posts)
  about.md             # about page
  feed.njk             # /feed.xml (RSS)
  posts/
    posts.11tydata.js  # shared front matter for every post
    *.md               # one post per file
    a-post/            # ...or a folder per post, with images alongside
      index.md
      images/pic.jpg
```

Fonts: **system fonts only** — no Google Fonts, no webfont requests, no
third-party calls. That's why the footer "No trackers, no slop" is literally
true. Nothing to configure.

## Writing a post

Two equally valid options.

**A) Quick post, no images.** Drop a Markdown file in `src/posts/`:

```markdown
---
title: Something Is Slop Again
date: 2026-02-01
description: One line that shows up in the list and the RSS feed.
tags:
  - sightings
---

Your text here.
```

It will be published at `/posts/something-is-slop-again/` and appear in the
list automatically (newest first). `tags` are optional.

**B) Post with images.** Make a folder, put an `index.md` inside, and keep
the images next to it:

```
src/posts/the-sighting/
  index.md
  images/screenshot.png
```

Reference images with a **relative** path from inside `index.md`:

```markdown
![what it is](images/screenshot.png)
```

That is the whole system. No image pipeline, no config to touch.

### Code blocks

Fenced code blocks get build-time syntax highlighting via the
[`@11ty/eleventy-plugin-syntaxhighlight`](https://github.com/11ty/eleventy-plugin-syntaxhighlight)
plugin (Prism — runs at build time, no client-side JS). Just use a normal
fenced block with a language:

````markdown
```js
const slop = detect(input);
```
````

Colors live in `src/css/style.css` under the `.token.*` rules.

## Submit posts via issues (community voting)

Anyone can suggest a post by opening an issue (the **Slop sighting** form). The
community votes with 👍 / 👎, and a scheduled workflow turns the winners into
posts automatically.

A submission gets published when **either**:

- it reaches **`VOTE_THRESHOLD` 👍** (default 10) with more 👍 than 👎, or
- you (the editor) add the **`approved`** label.

Add the **`rejected`** label to close a submission without publishing. Published
issues are commented with the post link, labelled `published`, and closed.

**One-time setup:** run the **Publish from voted issues** workflow once
(Actions → that workflow → *Run workflow*). It creates the labels it needs
(`submission`, `approved`, `rejected`, `published`) automatically — the form
can only apply `submission` once it exists, so do this before inviting
submissions.

How it works: `.github/ISSUE_TEMPLATE/slop-sighting.yml` (the form) →
`.github/workflows/publish-from-issues.yml` (runs every 6h, on manual dispatch,
and when you label an issue) → `tools/issue-to-post.cjs` (issue → Markdown). The
threshold lives in the workflow's `VOTE_THRESHOLD` env. Submitted screenshots are
hosted on GitHub's CDN (referenced by URL, not co-located).

## Configure the site

Edit `src/_data/site.js`:

- `title`, `tagline`, `description`, `author.name`
- `url`: the bare origin `https://aislopwatch.com` — **no trailing slash, no
  subpath**. It is used for RSS, the sitemap, and the absolute OG image URL.
  The site is served at the root of the custom domain, so there is no subpath
  to add.

## Social / OG image

There is a site-wide Open Graph image at `src/static/og.png` (1200×630),
referenced by the `<head>` meta in `src/_includes/base.njk`. To rebrand it,
edit `src/static/og.svg` and re-render to `og.png`. (The committed one was
rendered with macOS `qlmanage` + `sips`, but any SVG→PNG tool works — just
target 1200×630.)

## Hosting (Cloudflare Pages + custom domain)

Code lives at `git@github.com:aislopwatch/web.git`. The site is hosted on
**Cloudflare Pages** (it needs Cloudflare Functions + D1 for the live view/blame
features — GitHub Pages can't run those), served at the root of **aislopwatch.com**.

- Build command: `npm run build` · output dir: `public/`
- `src/static/CNAME` carries the domain; `PATH_PREFIX` is unset so
  `eleventy.config.js` defaults `pathPrefix` to `/` (no subpath).
- The publish + refresh workflows just **commit** to `main`; Cloudflare rebuilds
  and deploys on push.

Full setup (D1, bindings, domain, secrets) lives in `.local/CLOUDFLARE.md`.

## Community: submissions + comments (one public repo)

This repo is **public but anonymous** (commits are authored as `AISlopWatch`).
Two community features both live here:

- **Submissions** → people open an **Issue** via the
  [slop-sighting form](.github/ISSUE_TEMPLATE/slop-sighting.yml); the
  publish workflow turns voted/approved ones into posts.
- **Comments** → [giscus](https://giscus.app/) stores them as **GitHub
  Discussions** in this same repo (keyed by post pathname).

Wire up giscus once, then flip `enabled: true`:

1. Enable the **Discussions** feature on `aislopwatch/web`, and install the
   [giscus app](https://github.com/apps/giscus) on it.
2. Go to https://giscus.app/, enter `aislopwatch/web`, mapping **pathname**, and
   copy the `repoId` and `categoryId`.
3. Paste those into the `comments` block in `src/_data/site.js`.

## License

Your content is yours. Do what you like with the template.
