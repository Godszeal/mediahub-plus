import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();

    if (!videoId) {
      throw new Error("Video ID is required");
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.append("part", "snippet,contentDetails,statistics");
    url.searchParams.append("id", videoId);
    url.searchParams.append("key", YOUTUBE_API_KEY!);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching video details:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
