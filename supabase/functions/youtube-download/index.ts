import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  videoId: string;
  quality: string;
  format: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, quality, format }: DownloadRequest = await req.json();
    
    console.log(`Download request for video ${videoId} with quality ${quality} and format ${format}`);

    // Use yt-dlp compatible API endpoints
    const ytDlpApiUrl = 'https://yt-dlp-api.vercel.app';
    
    // Get video info first
    const infoResponse = await fetch(`${ytDlpApiUrl}/api/info?url=https://youtube.com/watch?v=${videoId}`);
    
    if (!infoResponse.ok) {
      throw new Error('Failed to fetch video info');
    }

    const videoInfo = await infoResponse.json();
    
    // Construct download URL based on format and quality
    let downloadUrl: string;
    
    if (format === 'audio') {
      downloadUrl = `${ytDlpApiUrl}/api/download?url=https://youtube.com/watch?v=${videoId}&format=bestaudio`;
    } else {
      // Map quality to YouTube format codes
      const qualityMap: Record<string, string> = {
        '144p': '160',
        '240p': '133',
        '360p': '134',
        '480p': '135',
        '720p': '136',
        '1080p': '137',
      };
      
      const formatCode = qualityMap[quality] || 'best';
      downloadUrl = `${ytDlpApiUrl}/api/download?url=https://youtube.com/watch?v=${videoId}&format=${formatCode}+bestaudio`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        videoInfo: {
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          uploader: videoInfo.uploader,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Download error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});