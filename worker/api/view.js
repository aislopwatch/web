// POST /api/view  { slug }  — count a view, deduped per (post, viewer, UTC day)
// so reloads/bots don't each cost a D1 write. views is DERIVED from views_log
// (COUNT) in one atomic batch. Cookieless, no PII (salted, day-rotating hash).
import { bad, readSlug, voterHash, counts, utcDay } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  const slug = await readSlug(request);
  if (!slug) return bad("invalid slug");
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const viewer = await voterHash(ip, `${slug}|view|${utcDay()}`, env.VOTE_SALT);

    await env.DB.batch([
      env.DB.prepare(
        "INSERT OR IGNORE INTO views_log (slug, viewer) VALUES (?1, ?2)"
      ).bind(slug, viewer),
      env.DB.prepare(
        `INSERT INTO engagement (slug, views, votes)
           VALUES (?1, (SELECT COUNT(*) FROM views_log WHERE slug = ?1), 0)
         ON CONFLICT(slug) DO UPDATE
           SET views = (SELECT COUNT(*) FROM views_log WHERE slug = ?1)`
      ).bind(slug),
    ]);

    return Response.json({ ok: true, ...(await counts(env, slug)) });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
