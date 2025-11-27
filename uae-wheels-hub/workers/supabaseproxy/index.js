export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const SUPABASE_ORIGIN = "https://haordpdxyyreliyzmire.supabase.co";

    // Build upstream target by preserving path and query
    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, SUPABASE_ORIGIN);

    // Clone headers before use
    const reqHeaders = new Headers(request.headers);
    const origin = reqHeaders.get("Origin") || "*";

    // Preflight CORS
    if (request.method === "OPTIONS") {
      const h = new Headers();
      h.set("Access-Control-Allow-Origin", origin);
      h.set("Vary", "Origin");
      h.set("Access-Control-Allow-Credentials", "true");
      h.set("Access-Control-Allow-Headers", reqHeaders.get("Access-Control-Request-Headers") || "*");
      h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      h.set("Cache-Control", "no-store");
      return new Response(null, { status: 204, headers: h });
    }

    // Only cache GET to public storage objects (no Range support)
    const isPublicImage =
      request.method === "GET" &&
      upstreamUrl.pathname.startsWith("/storage/v1/object/public/") &&
      !reqHeaders.has("Range");

    if (isPublicImage) {
      const cache = caches.default;

      // 1) Check cache
      const cached = await cache.match(request);
      if (cached) {
        const c = new Response(cached.body, cached);
        c.headers.set("Access-Control-Allow-Origin", origin);
        c.headers.set("Vary", "Origin");
        c.headers.set("Access-Control-Allow-Credentials", "true");
        c.headers.set("Access-Control-Allow-Headers", "*");
        c.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        // 24h TTL; SWR for 60s
        c.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60");
        c.headers.set("X-Worker-Cache", "HIT");
        return c;
      }

      // 2) Fetch upstream
      const upstreamResp = await fetch(
        new Request(upstreamUrl, {
          method: "GET",
          headers: reqHeaders,
          redirect: "manual",
        })
      );

      const resp = new Response(upstreamResp.body, upstreamResp);
      resp.headers.set("Access-Control-Allow-Origin", origin);
      resp.headers.set("Vary", "Origin");
      resp.headers.set("Access-Control-Allow-Credentials", "true");
      resp.headers.set("Access-Control-Allow-Headers", "*");
      resp.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

      if (upstreamResp.status === 200) {
        resp.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60");
        resp.headers.set("X-Worker-Cache", "MISS");
        await cache.put(request, resp.clone());
      } else {
        resp.headers.set("Cache-Control", "no-store");
      }

      return resp;
    }

    // All other requests: proxy pass-through (no-store)
    const upstreamReq = new Request(upstreamUrl, {
      method: request.method,
      headers: reqHeaders,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });

    const upstreamResp = await fetch(upstreamReq);
    const resp = new Response(upstreamResp.body, upstreamResp);

    // CORS for all other responses
    resp.headers.set("Access-Control-Allow-Origin", origin);
    resp.headers.set("Vary", "Origin");
    resp.headers.set("Access-Control-Allow-Credentials", "true");
    resp.headers.set("Access-Control-Allow-Headers", "*");
    resp.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    resp.headers.set("Cache-Control", "no-store");

    return resp;
  }
}

