// Workers entry point. Serves the static site from ./public (Workers Static
// Assets) and dispatches the live engagement API. The /api/* handlers are the
// same modules that previously ran as Pages Functions — unchanged, just routed
// here instead of by the functions/ directory convention.
import { onRequestGet as board } from "./api/board.js";
import { onRequestPost as view } from "./api/view.js";
import { onRequestPost as vote } from "./api/vote.js";
import { onRequestPost as unvote } from "./api/unvote.js";

const ROUTES = {
  "GET /api/board": board,
  "POST /api/view": view,
  "POST /api/vote": vote,
  "POST /api/unvote": unvote,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const handler = ROUTES[`${request.method} ${url.pathname}`];
      if (handler) {
        // Rebuild the context shape the Pages-style handlers expect.
        return handler({ request, env, waitUntil: ctx.waitUntil.bind(ctx) });
      }
      return Response.json({ ok: false, error: "not found" }, { status: 404 });
    }
    // Static assets are served before the Worker runs; this only fires for
    // paths with no matching asset, so hand off to the assets binding (which
    // returns the configured 404 page).
    return env.ASSETS.fetch(request);
  },
};
