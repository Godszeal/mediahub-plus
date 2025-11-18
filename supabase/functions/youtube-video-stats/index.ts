import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } },
      5000
    );
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const instances = await res.json();
      for (const entry of instances) {
        const domain = entry?.[0];
        const meta = entry?.[1] || {};
        if (domain && meta?.api === true && (meta?.type === 'https' || (Array.isArray(meta?.type) && meta?.type.includes('https')))) {
          bases.push(`https://${domain}`);
        }
      }
    }
  } catch (_) {}
  bases.push('https://yewtu.be','https://invidious.nerdvpn.de','https://inv.nadeko.net','https://vid.puffyan.us');
  return Array.from(new Set(bases));
}

function getPipedBases(): string[] {
  return ['https://pipedapi.kavin.rocks','https://piped.video','https://piped.yt','https://watch.leptons.xyz','https://piped.mha.fi'];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { videoIds } = await req.json();
    const ids = Array.isArray(videoIds) ? videoIds : String(videoIds || '').split(',').filter(Boolean);
    if (!ids.length) return new Response(JSON.stringify({ items: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    const results: any[] = [];

    for (const id of ids) {
      let details: any | null = null;

      // Try Invidious
      for (const base of await getInvidiousBases()) {
        try {
          const r = await fetchWithTimeout(`${base}/api/v1/videos/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }, 7000);
          const ct = r.headers.get('content-type') || '';
          if (!r.ok || !ct.includes('application/json')) continue;
          const v = await r.json();
          const secs = Number(v.lengthSeconds || 0);
          details = {
            videoId: v.videoId || id,
            duration: secs > 0 ? formatDuration(`PT${secs}S`) : '0:00',
            views: parseInt(v.viewCount || 0),
            likes: parseInt(v.likeCount || 0),
            subscribers: 0,
          };
          break;
        } catch (_) {}
      }

      // Fallback to Piped
      if (!details) {
        for (const base of getPipedBases()) {
          try {
            const r = await fetchWithTimeout(`${base}/api/v1/video/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }, 7000);
            const ct = r.headers.get('content-type') || '';
            if (!r.ok || !ct.includes('application/json')) continue;
            const v = await r.json();
            const secs = Number(v.duration || 0);
            details = {
              videoId: id,
              duration: secs > 0 ? formatDuration(`PT${secs}S`) : '0:00',
              views: parseInt(v.views || 0),
              likes: parseInt(v.likes || 0),
              subscribers: 0,
            };
            break;
          } catch (_) {}
        }
      }

      if (details) results.push(details);
    }

    return new Response(JSON.stringify({ items: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    console.error('Video stats error:', error?.message);
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
