// POST /api/vote  { slug, "cf-turnstile-response"? }  — cast one "blame" vote.
// Deduped per post by a salted hash of the caller's IP. votes is DERIVED from
// votes_log (COUNT) inside one atomic batch, so it self-heals and never drifts.
// If TURNSTILE_SECRET is configured, a valid Turnstile token is required.
import { bad, SLUG, voterHash, counts, turnstileOk } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad("invalid body");
  }
  const slug = body && SLUG.test(body.slug || "") ? body.slug : null;
  if (!slug) return bad("invalid slug");

  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  if (!(await turnstileOk(body["cf-turnstile-response"], env.TURNSTILE_SECRET, ip))) {
    return Response.json({ ok: false, error: "challenge" }, { status: 403 });
  }

  try {
    const voter = await voterHash(ip, slug, env.VOTE_SALT);
    const [ins] = await env.DB.batch([
      env.DB.prepare(
        "INSERT OR IGNORE INTO votes_log (slug, voter) VALUES (?1, ?2)"
      ).bind(slug, voter),
      env.DB.prepare(
        `INSERT INTO engagement (slug, views, votes)
           VALUES (?1, 0, (SELECT COUNT(*) FROM votes_log WHERE slug = ?1))
         ON CONFLICT(slug) DO UPDATE
           SET votes = (SELECT COUNT(*) FROM votes_log WHERE slug = ?1)`
      ).bind(slug),
    ]);
    return Response.json({
      ok: true,
      counted: ins.meta.changes > 0,
      ...(await counts(env, slug)),
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
