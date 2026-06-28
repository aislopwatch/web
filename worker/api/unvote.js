// POST /api/unvote  { slug }  — undo a blame from this caller. Deletes the
// votes_log row for the salted voter hash, then re-derives the count (atomic
// batch). Idempotent: undoing a non-existent vote is a no-op.
import { bad, readSlug, voterHash, counts } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  const slug = await readSlug(request);
  if (!slug) return bad("invalid slug");
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const voter = await voterHash(ip, slug, env.VOTE_SALT);

    const [del] = await env.DB.batch([
      env.DB.prepare(
        "DELETE FROM votes_log WHERE slug = ?1 AND voter = ?2"
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
      removed: del.meta.changes > 0,
      ...(await counts(env, slug)),
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
