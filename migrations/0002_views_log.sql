-- Per-(post, salted viewer-hash) view dedup. The viewer hash folds in a UTC day
-- stamp, so a given source counts at most one view per post per day — this caps
-- D1 writes (reloads/bots don't each cost a write) and keeps "views" meaningful.
-- No PII: viewer is a non-reversible salted hash, same as votes_log.voter.
CREATE TABLE IF NOT EXISTS views_log (
  slug   TEXT NOT NULL,
  viewer TEXT NOT NULL,
  PRIMARY KEY (slug, viewer)
);
