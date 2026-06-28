// GET /api/board — live view/vote counts for every post. Edge-cached via the
// Cache API (a Cache-Control header alone does NOT cache a Function response),
// so a burst of board loads collapses to ~one D1 read per PoP per 30s.
// Degrades to an empty list on any DB hiccup (failures are not cached).
export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  let body;
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, views, votes FROM engagement"
    ).all();
    body = { posts: results || [] };
  } catch {
    return Response.json({ posts: [] }); // don't cache an error
  }

  const res = Response.json(body, {
    headers: { "cache-control": "public, max-age=30" },
  });
  if (waitUntil) waitUntil(cache.put(request, res.clone()));
  return res;
}
