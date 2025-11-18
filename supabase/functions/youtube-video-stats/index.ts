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

    if (!videoIds || videoIds.length === 0) {
      return new Response(
        JSON.stringify({ items: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Fetching stats for ${videoIds.length} videos using Invidious API`);

    // Fetch video details from Invidious API (no API key needed)
    const videoPromises = videoIds.map(async (videoId: string) => {
      try {
        const response = await fetch(
          `https://invidious.io/api/v1/videos/${videoId}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch video ${videoId}: ${response.status}`);
          return null;
        }

        const video = await response.json();
        
        return {
          videoId: video.videoId,
          duration: formatDuration(`PT${video.lengthSeconds}S`),
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
    const formattedData = results.filter(item => item !== null);

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
      JSON.stringify({ 
        error: error?.message || 'An error occurred',
        details: "Using free Invidious API - no YouTube API key required"
      }),
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