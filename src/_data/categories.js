// Verdict badges for the post taxonomy. Keys match the tags the issue form
// produces (see tools/issue-to-post.cjs CATEGORY_MAP) plus the "sightings"
// fallback. `stamp: true` renders a red "correction stamp" badge (the verdicts);
// the rest render as a plain outlined chip. `blurb` powers the homepage legend.
export default {
  slop: { label: "slop", stamp: true, blurb: "churned out with AI, shipped without reading it back." },
  hype: { label: "hype", stamp: true, blurb: "a human overselling AI to you." },
  guides: { label: "guide", stamp: false, blurb: "how to spot it yourself." },
  tells: { label: "tell", stamp: false, blurb: "the giveaways that something is slop." },
  meta: { label: "meta", stamp: false, blurb: "about the desk itself." },
  sightings: { label: "sighting", stamp: false, blurb: "filed for review." },
};
