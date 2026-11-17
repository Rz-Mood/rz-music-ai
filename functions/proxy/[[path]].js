// Cloudflare Pages Function: /proxy/<path>  ->  https://archive.org/<path>
// Only the few archive.org paths the music player needs are allowed (not an open proxy).
const ALLOWED_PATHS = /^\/(advancedsearch\.php|metadata\/|download\/|services\/img\/|details\/)/;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, Content-Type",
};

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const url = new URL(request.url);
  // Take the path from the URL itself so percent-encoding is kept exactly as sent.
  const path = url.pathname.replace(/^\/proxy/, "") || "/";
  if (path === "/") {
    return new Response("OK: archive.org proxy", { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (!ALLOWED_PATHS.test(path)) return new Response("Not allowed", { status: 403, headers: CORS });

  const headers = new Headers();
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);
  headers.set("User-Agent", "Mozilla/5.0 (music-player-proxy)");

  const res = await fetch("https://archive.org" + path + url.search, { method: request.method, headers, redirect: "follow" });

  const out = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) out.set(k, v);
  out.delete("set-cookie");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}
