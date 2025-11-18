import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function getInvidiousBase(): Promise<string> {
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
  } catch (e) {
    console.warn("Failed to fetch instances list", e);
  }
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
  return "https://yewtu.be";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 25, type = "video" } = await req.json();

    if (!query) {
      throw new Error("Search query is required");
    }

    const base = await getInvidiousBase();
    const searchUrl = new URL(`${base}/api/v1/search`);
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", ["video", "channel", "playlist", "all"].includes(type) ? type : "video");

    const response = await fetchWithTimeout(searchUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
    }, 7000);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Search failed: ${response.status} ${body}`);
    }

    const results = await response.json();

    const formattedData = {
      kind: "youtube#searchListResponse",
      items: (results || []).slice(0, maxResults).map((item: any) => ({
        kind: "youtube#searchResult",
        id: {
          kind: `youtube#${item.type || "video"}`,
          videoId: item.videoId || item.playlistId || item.authorId,
        },
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
    };

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error searching videos:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Unknown error",
        details: "Using dynamic Invidious instance - no YouTube API key required",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
