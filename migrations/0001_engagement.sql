-- Live engagement for AISlopWatch. Aggregate counts only — no per-visitor rows,
-- no PII. The one identifier we keep (votes_log.voter) is a salted SHA-256 hash
-- of the IP, used solely to stop a single source double-voting. It is not
-- reversible to an IP and is never associated with anything else.

CREATE TABLE IF NOT EXISTS engagement (
  slug  TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0
);

-- One vote per (post, salted-IP-hash). Insert-or-ignore is the dedup.
CREATE TABLE IF NOT EXISTS votes_log (
  slug  TEXT NOT NULL,
  voter TEXT NOT NULL,
  PRIMARY KEY (slug, voter)
);

CREATE INDEX IF NOT EXISTS idx_engagement_votes ON engagement(votes DESC);
