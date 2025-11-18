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
    const body = await req.json().catch(() => ({}));
    const category = (body?.category || "").toString().toLowerCase();
    const allowed = ["default", "music", "gaming", "news"]; // avoid movies (often unsupported)

    // Try Invidious first
    const inv = await getInvidiousBase();
    if (inv) {
      const url = new URL(`${inv}/api/v1/trending`);
      if (category && allowed.includes(category)) url.searchParams.set("type", category);
      const response = await fetchWithTimeout(
        url.toString(),
        { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
        7000
      );
      if (response.ok) {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const videos = await response.json();
          const formatted = {
            kind: "youtube#videoListResponse",
            items: (videos || []).slice(0, 50).map((video: any) => ({
              kind: "youtube#video",
              id: video.videoId,
              snippet: {
                publishedAt: video.published ? new Date(video.published * 1000).toISOString() : new Date().toISOString(),
                channelId: video.authorId || "",
                title: video.title || "",
                description: video.description || "",
                thumbnails: {
                  default: { url: video.videoThumbnails?.[0]?.url || "" },
                  medium: { url: video.videoThumbnails?.[2]?.url || video.videoThumbnails?.[0]?.url || "" },
                  high: { url: video.videoThumbnails?.[4]?.url || video.videoThumbnails?.[2]?.url || "" },
                },
                channelTitle: video.author || "",
              },
              contentDetails: { duration: `PT${Number(video.lengthSeconds || 0)}S` },
              statistics: { viewCount: String(video.viewCount || 0), likeCount: String(video.likeCount || 0) },
            })),
          } as const;
          return new Response(JSON.stringify(formatted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Fallback to Piped
    const piped = await getPipedBase();
    if (!piped) throw new Error("No video provider available");
    const pres = await fetchWithTimeout(`${piped}/api/v1/trending`, { headers: { "User-Agent": "Mozilla/5.0" } }, 7000);
    if (!pres.ok) throw new Error(`Failed to fetch trending videos: ${pres.status}`);
    const pvideos = await pres.json();

    const formatted = {
      kind: "youtube#videoListResponse",
      items: (Array.isArray(pvideos) ? pvideos : []).slice(0, 50).map((v: any) => ({
        kind: "youtube#video",
        id: v.id || v.url || "",
        snippet: {
          publishedAt: v.uploaded ? new Date(v.uploaded).toISOString() : new Date().toISOString(),
          channelId: v.uploaderUrl || "",
          title: v.title || "",
          description: v.shortDescription || "",
          thumbnails: { default: { url: v.thumbnail || "" }, medium: { url: v.thumbnail || "" }, high: { url: v.thumbnail || "" } },
          channelTitle: v.uploaderName || "",
        },
        contentDetails: { duration: `PT${Number(v.duration || 0)}S` },
        statistics: { viewCount: String(v.views || 0), likeCount: "0" },
      })),
    };

    return new Response(JSON.stringify(formatted), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: any) {
    console.error("Error fetching trending videos:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error", details: "Provider fallback (Invidious→Piped)" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
