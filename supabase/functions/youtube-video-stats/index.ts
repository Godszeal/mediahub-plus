import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoIds } = await req.json();

    if (!videoIds || (Array.isArray(videoIds) && videoIds.length === 0)) {
      return new Response(JSON.stringify({ items: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const base = await getInvidiousBase();

    const videoPromises = (Array.isArray(videoIds) ? videoIds : String(videoIds).split(',')).map(async (videoId: string) => {
      try {
        const response = await fetchWithTimeout(
          `${base}/api/v1/videos/${videoId}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } },
          7000
        );

        if (!response.ok) {
          console.error(`Failed to fetch video ${videoId}: ${response.status}`);
          return null;
        }

        const video = await response.json();
        const lengthSeconds = Number(video.lengthSeconds || 0);
        const duration = lengthSeconds > 0 ? formatDuration(`PT${lengthSeconds}S`) : '0:00';

        return {
          videoId: video.videoId || videoId,
          duration,
          views: parseInt(video.viewCount || 0),
          likes: parseInt(video.likeCount || 0),
          subscribers: 0,
        };
      } catch (error) {
        console.error(`Error fetching video ${videoId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(videoPromises);
    const items = results.filter((x) => x !== null);

    return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    console.error('Error fetching video stats:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'An error occurred', details: 'Using dynamic Invidious instance - no YouTube API key required' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  const h = hours ? parseInt(hours) : 0;
  const m = minutes ? parseInt(minutes) : 0;
  const s = seconds ? parseInt(seconds) : 0;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
