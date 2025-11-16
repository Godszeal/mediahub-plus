import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const {
      videoId,
      videoTitle,
      videoThumbnail,
      channelName,
      downloadType,
      quality,
    } = await req.json();

    if (!videoId || !videoTitle || !downloadType) {
      throw new Error("Missing required fields");
    }

    // Insert download record
    const { data: download, error } = await supabase
      .from("downloads")
      .insert({
        user_id: user.id,
        video_id: videoId,
        video_title: videoTitle,
        video_thumbnail: videoThumbnail,
        channel_name: channelName,
        download_type: downloadType,
        quality: quality || "high",
        status: "pending",
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // In a real implementation, you would trigger a background job here
    // For now, we'll simulate the download process
    console.log(`Download initiated for video ${videoId}`);

    return new Response(
      JSON.stringify({ success: true, download }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error initiating download:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
