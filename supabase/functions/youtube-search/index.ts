import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function getInvidiousBase(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      "https://api.invidious.io/instances.json?sort_by=type,health",
      { headers: { "User-Agent": "Mozilla/5.0" } },
      5000
    );
    if (res.ok) {
      const instances = await res.json();
      for (const entry of instances) {
        const domain = entry?.[0];
        const meta = entry?.[1] || {};
        if (!domain || !meta) continue;
        if (meta.api === true && (meta.type === "https" || (Array.isArray(meta.type) && meta.type.includes("https")))) {
          const base = `https://${domain}`;
          const stats = await fetchWithTimeout(`${base}/api/v1/stats`, { headers: { "User-Agent": "Mozilla/5.0" } }, 2500);
          if (stats.ok) return base;
        }
      }
    }
  } catch (_) {}
  const fallbacks = [
    "https://yewtu.be",
    "https://invidious.nerdvpn.de",
    "https://inv.nadeko.net",
    "https://vid.puffyan.us",
  ];
  for (const base of fallbacks) {
    try {
      const stats = await fetchWithTimeout(`${base}/api/v1/stats`, { headers: { "User-Agent": "Mozilla/5.0" } }, 2500);
      if (stats.ok) return base;
    } catch (_) {}
  }
  return null;
}

async function getPipedBase(): Promise<string | null> {
  const fallbacks = [
    "https://piped.video",
    "https://pipedapi.kavin.rocks",
    "https://piped.yt",
    "https://watch.leptons.xyz",
  ];
  for (const base of fallbacks) {
    try {
      const res = await fetchWithTimeout(`${base}/api/v1/trending`, { headers: { "User-Agent": "Mozilla/5.0" } }, 3000);
      if (res.ok) return base;
    } catch (_) {}
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 25, type = "video" } = await req.json();
    if (!query) throw new Error("Search query is required");

    // Try Invidious
    const inv = await getInvidiousBase();
    if (inv) {
      const url = new URL(`${inv}/api/v1/search`);
      url.searchParams.set("q", query);
      if (["video", "channel", "playlist", "all"].includes(type)) url.searchParams.set("type", type);
      const res = await fetchWithTimeout(url.toString(), { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }, 7000);
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const preview = await res.text().catch(() => "");
          console.warn("Invidious returned non-JSON", preview.slice(0, 120));
        } else {
          let results: any[] = [];
          try { results = await res.json(); } catch (e) { console.warn("JSON parse failed for Invidious", e); }
          if (Array.isArray(results) && results.length) {
            const formatted = {
              kind: "youtube#searchListResponse",
              items: (results || []).slice(0, maxResults).map((item: any) => ({
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
              })),
            } as const;
            return new Response(JSON.stringify(formatted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
      }
    }

    // Fallback to Piped
    const piped = await getPipedBase();
    if (!piped) throw new Error("No search provider available");
    const surl = new URL(`${piped}/api/v1/search`);
    surl.searchParams.set("q", query);
    const pres = await fetchWithTimeout(surl.toString(), { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }, 7000);
    if (!pres.ok) throw new Error(`Search failed: ${pres.status}`);
    const ct2 = pres.headers.get("content-type") || "";
    if (!ct2.includes("application/json")) {
      const preview = await pres.text().catch(() => "");
      throw new Error(`Search provider returned non-JSON (${ct2}): ${preview.slice(0,120)}`);
    }
    const items = await pres.json();

    const formatted = {
      kind: "youtube#searchListResponse",
      items: (Array.isArray(items) ? items : []).slice(0, maxResults).map((it: any) => ({
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
      })),
    };

    return new Response(JSON.stringify(formatted), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: any) {
    console.error("Error searching videos:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error", details: "Provider fallback (Invidious→Piped)" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
