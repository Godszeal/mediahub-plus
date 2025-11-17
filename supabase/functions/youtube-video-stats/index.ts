import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoIds } = await req.json();
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const videoIdsString = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIdsString}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Format the response
    const formattedData = data.items?.map((item: any) => ({
      videoId: item.id,
      duration: formatDuration(item.contentDetails.duration),
      views: parseInt(item.statistics.viewCount || 0),
      likes: parseInt(item.statistics.likeCount || 0),
      subscribers: parseInt(item.statistics.subscriberCount || 0),
    })) || [];

    return new Response(
      JSON.stringify({ items: formattedData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error fetching video stats:', error);
    
    return new Response(
      JSON.stringify({ error: error?.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
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
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  
  return `${m}:${s.toString().padStart(2, '0')}`;
}