import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function getInvidiousBases(): Promise<string[]> {
  const bases: string[] = [];
  try {
    const res = await fetchWithTimeout(
      "https://api.invidious.io/instances.json?sort_by=type,health",
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
      5000
    );
    if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
      const instances = await res.json();
      for (const entry of instances) {
        const domain = entry?.[0];
        const meta = entry?.[1] || {};
        if (domain && meta?.api === true && (meta?.type === "https" || (Array.isArray(meta?.type) && meta?.type.includes("https")))) {
          bases.push(`https://${domain}`);
        }
      }
    }
  } catch (_) {}
  bases.push(
    "https://yewtu.be",
    "https://invidious.nerdvpn.de",
    "https://inv.nadeko.net",
    "https://vid.puffyan.us"
  );
  return Array.from(new Set(bases));
}

function getPipedBases(): string[] {
  return [
    "https://pipedapi.kavin.rocks",
    "https://piped.video",
    "https://piped.yt",
    "https://watch.leptons.xyz",
    "https://piped.mha.fi"
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query, maxResults = 25, type = "video" } = await req.json();
    if (!query) throw new Error("Search query is required");

    // Try Invidious providers first
    for (const base of await getInvidiousBases()) {
      try {
        const url = new URL(`${base}/api/v1/search`);
        url.searchParams.set("q", query);
        if (["video", "channel", "playlist", "all"].includes(type)) url.searchParams.set("type", type);
        const res = await fetchWithTimeout(url.toString(), { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }, 8000);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) continue;
        const results = await res.json();
        if (!Array.isArray(results) || !results.length) continue;
        const formatted = {
          kind: "youtube#searchListResponse",
          items: results.slice(0, maxResults).map((item: any) => ({
            kind: "youtube#searchResult",
            id: { kind: `youtube#${item.type || "video"}`, videoId: item.videoId || item.playlistId || item.authorId },
            snippet: {
              publishedAt: item.published ? new Date(item.published * 1000).toISOString() : new Date().toISOString(),
              channelId: item.authorId || "",
              title: item.title || "",
              description: item.description || "",
              thumbnails: {
                default: { url: item.videoThumbnails?.[0]?.url || "" },
                medium: { url: item.videoThumbnails?.[2]?.url || item.videoThumbnails?.[0]?.url || "" },
                high: { url: item.videoThumbnails?.[4]?.url || item.videoThumbnails?.[2]?.url || "" },
              },
              channelTitle: item.author || "",
            },
          }))
        } as const;
        return new Response(JSON.stringify(formatted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (_) { /* try next */ }
    }

    // Fallback to Piped providers
    for (const base of getPipedBases()) {
      try {
        const surl = new URL(`${base}/api/v1/search`);
        surl.searchParams.set("q", query);
        const pres = await fetchWithTimeout(surl.toString(), { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }, 8000);
        const ct2 = pres.headers.get("content-type") || "";
        if (!pres.ok || !ct2.includes("application/json")) continue;
        const items = await pres.json();
        if (!Array.isArray(items) || !items.length) continue;
        const formatted = {
          kind: "youtube#searchListResponse",
          items: items.slice(0, maxResults).map((it: any) => ({
            kind: "youtube#searchResult",
            id: { kind: "youtube#video", videoId: it.id || it.url || "" },
            snippet: {
              publishedAt: it.uploaded ? new Date(it.uploaded).toISOString() : new Date().toISOString(),
              channelId: it.uploaderUrl || "",
              title: it.title || "",
              description: it.shortDescription || "",
              thumbnails: { default: { url: it.thumbnail || "" }, medium: { url: it.thumbnail || "" }, high: { url: it.thumbnail || "" } },
              channelTitle: it.uploaderName || "",
            },
          }))
        } as const;
        return new Response(JSON.stringify(formatted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (_) { /* try next */ }
    }

    throw new Error("No search provider returned JSON");
  } catch (error: any) {
    console.error("Search error:", error?.message);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error", details: "Provider fallback (Invidious→Piped)" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
