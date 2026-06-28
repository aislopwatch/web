// Shared helpers for the engagement API. Files prefixed with "_" are not routed.

export const SLUG = /^[a-z0-9-]{1,80}$/;

export function bad(msg = "bad request") {
  return Response.json({ ok: false, error: msg }, { status: 400 });
}

// Per-(post, IP) pseudonym for vote dedup. Salted + per-slug so it is neither
// reversible to an IP nor linkable across posts. No raw IP is ever stored.
export async function voterHash(ip, slug, salt) {
  const data = new TextEncoder().encode(`${ip}|${slug}|${salt || "aislopwatch"}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// UTC day stamp (YYYY-MM-DD) — folded into the view hash so a viewer counts at
// most once per post per day, capping D1 writes without tracking anyone.
export function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

export async function readSlug(request) {
  try {
    const { slug } = await request.json();
    return SLUG.test(slug || "") ? slug : null;
  } catch {
    return null;
  }
}

// Optional Cloudflare Turnstile verification. Returns true when no secret is
// configured (so local/preview keep working) OR when the token verifies.
export async function turnstileOk(token, secret, ip) {
  if (!secret) return true; // not configured → don't block
  if (!token) return false;
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    const j = await r.json();
    return !!j.success;
  } catch {
    return false;
  }
}

export async function counts(env, slug) {
  const row = await env.DB.prepare(
    "SELECT views, votes FROM engagement WHERE slug = ?1"
  )
    .bind(slug)
    .first();
  return { views: row?.views || 0, votes: row?.votes || 0 };
}
