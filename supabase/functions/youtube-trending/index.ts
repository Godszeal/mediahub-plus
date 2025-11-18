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
    const { category } = (await req.json().catch(() => ({}))) as { category?: string };
    const allowed = ["default", "music", "gaming", "news", "movies"];
    const base = await getInvidiousBase();

    const url = new URL(`${base}/api/v1/trending`);
    if (category && allowed.includes(category.toLowerCase())) {
      url.searchParams.set("type", category.toLowerCase());
    }

    const response = await fetchWithTimeout(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
    }, 7000);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Failed to fetch trending videos: ${response.status} ${body}`);
    }

    const videos = await response.json();

    const formattedData = {
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
        contentDetails: {
          duration: `PT${Number(video.lengthSeconds || 0)}S`,
        },
        statistics: {
          viewCount: String(video.viewCount || 0),
          likeCount: String(video.likeCount || 0),
        },
      })),
    };

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error fetching trending videos:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Unknown error",
        details: "Using dynamic Invidious instance - no YouTube API key required",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
