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
    const { query, maxResults = 25, type = "video" } = await req.json();

    if (!query) {
      throw new Error("Search query is required");
    }

    console.log(`Searching for: ${query} (using free Invidious API)`);

    // Use Invidious API for search (no API key required)
    const searchUrl = `https://invidious.io/api/v1/search?q=${encodeURIComponent(query)}&type=${type}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Invidious API error: ${response.status}`);
      throw new Error(`Search failed: ${response.status}`);
    }

    const results = await response.json();

    // Transform to match YouTube API format
    const formattedData = {
      kind: "youtube#searchListResponse",
      items: results.slice(0, maxResults).map((item: any) => ({
        kind: "youtube#searchResult",
        id: {
          kind: `youtube#${item.type}`,
          videoId: item.videoId || item.playlistId || item.authorId,
        },
        snippet: {
          publishedAt: item.publishedText || new Date().toISOString(),
          channelId: item.authorId,
          title: item.title,
          description: item.description || "",
          thumbnails: {
            default: { url: item.videoThumbnails?.[0]?.url || "" },
            medium: { url: item.videoThumbnails?.[2]?.url || "" },
            high: { url: item.videoThumbnails?.[4]?.url || "" },
          },
          channelTitle: item.author,
        },
      })),
    };

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error searching videos:", error);
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
