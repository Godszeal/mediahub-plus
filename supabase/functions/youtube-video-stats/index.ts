import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoIds } = await req.json();
    const ids = Array.isArray(videoIds) ? videoIds : String(videoIds || '').split(',').filter(Boolean);
    if (!ids.length) return new Response(JSON.stringify({ items: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    const inv = await getInvidiousBase();
    const piped = await getPipedBase();

    const items = [] as any[];

    for (const id of ids) {
      let details: any | null = null;

      // Try Invidious first
      if (inv) {
        try {
          const res = await fetchWithTimeout(`${inv}/api/v1/videos/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 6000);
          if (res.ok) {
            const v = await res.json();
            const secs = Number(v.lengthSeconds || 0);
            details = {
              videoId: v.videoId || id,
              duration: secs > 0 ? formatDuration(`PT${secs}S`) : '0:00',
              views: parseInt(v.viewCount || 0),
              likes: parseInt(v.likeCount || 0),
              subscribers: 0,
            };
          }
        } catch (_) {}
      }

      // Fallback to Piped
      if (!details && piped) {
        try {
          const res = await fetchWithTimeout(`${piped}/api/v1/video/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 6000);
          if (res.ok) {
            const v = await res.json();
            const secs = Number(v.duration || 0);
            details = {
              videoId: id,
              duration: secs > 0 ? formatDuration(`PT${secs}S`) : '0:00',
              views: parseInt(v.views || 0),
              likes: parseInt(v.likes || 0),
              subscribers: 0,
            };
          }
        } catch (_) {}
      }

      if (details) items.push(details);
    }

    return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    console.error('Error fetching video stats:', error);
    return new Response(JSON.stringify({ error: error?.message || 'An error occurred', details: 'Provider fallback (Invidious→Piped)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
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
