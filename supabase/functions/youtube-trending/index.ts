import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching trending videos using scraping method");
    
    // Use Invidious API as a free alternative (no API key required)
    const response = await fetch(
      "https://invidious.io/api/v1/trending?type=movies",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      console.error(`Invidious API error: ${response.status}`);
      throw new Error(`Failed to fetch trending videos: ${response.status}`);
    }

    const videos = await response.json();
    
    // Transform to match YouTube API format
    const formattedData = {
      kind: "youtube#videoListResponse",
      items: videos.slice(0, 50).map((video: any) => ({
        kind: "youtube#video",
        id: video.videoId,
        snippet: {
          publishedAt: new Date(video.published * 1000).toISOString(),
          channelId: video.authorId,
          title: video.title,
          description: video.description || "",
          thumbnails: {
            default: { url: video.videoThumbnails?.[0]?.url || "" },
            medium: { url: video.videoThumbnails?.[2]?.url || "" },
            high: { url: video.videoThumbnails?.[4]?.url || "" },
          },
          channelTitle: video.author,
        },
        contentDetails: {
          duration: `PT${video.lengthSeconds}S`,
        },
        statistics: {
          viewCount: video.viewCount.toString(),
          likeCount: "0",
        },
      })),
    };

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching trending videos:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Using free Invidious API - no YouTube API key required"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
