import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
      5000
    );
    if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
      const instances = await res.json();
      for (const entry of instances) {
        const domain = entry?.[0];
        const meta = entry?.[1] || {};
        if (domain && meta?.api === true && (meta?.type === "https" || (Array.isArray(meta?.type) && meta?.type.includes("https")))) {
          bases.push(`https://${domain}`);
        }
      }
    }
  } catch (_) {}
  bases.push(
    "https://yewtu.be",
    "https://invidious.nerdvpn.de",
    "https://inv.nadeko.net",
    "https://vid.puffyan.us"
  );
  return Array.from(new Set(bases));
}

function getPipedBases(): string[] {
  return [
    "https://pipedapi.kavin.rocks",
    "https://piped.video",
    "https://pipedapi.adminforge.de",
    "https://pipedapi-libre.kavin.rocks"
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, maxResults = 50 } = await req.json();

    if (!videoId) {
      throw new Error("Video ID is required");
    }

    // Try YouTube API first
    if (YOUTUBE_API_KEY) {
      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
        url.searchParams.append("part", "snippet,replies");
        url.searchParams.append("videoId", videoId);
        url.searchParams.append("maxResults", maxResults.toString());
        url.searchParams.append("order", "relevance");
        url.searchParams.append("key", YOUTUBE_API_KEY);

        const response = await fetchWithTimeout(url.toString(), {}, 8000);
        if (response.ok) {
          const data = await response.json();
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("YouTube API failed:", error);
      }
    }

    // Try Invidious providers
    for (const base of await getInvidiousBases()) {
      try {
        const url = `${base}/api/v1/comments/${videoId}`;
        const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }, 8000);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) continue;
        const data = await res.json();
        if (!data || !Array.isArray(data.comments)) continue;

        // Format to match YouTube API response
        const formatted = {
          kind: "youtube#commentThreadListResponse",
          items: data.comments.slice(0, maxResults).map((comment: any) => ({
            kind: "youtube#commentThread",
            id: comment.commentId || "",
            snippet: {
              topLevelComment: {
                kind: "youtube#comment",
                id: comment.commentId || "",
                snippet: {
                  authorDisplayName: comment.author || "",
                  authorProfileImageUrl: comment.authorThumbnails?.[0]?.url || "",
                  authorChannelUrl: comment.authorUrl || "",
                  textDisplay: comment.content || "",
                  textOriginal: comment.content || "",
                  likeCount: comment.likeCount || 0,
                  publishedAt: comment.published ? new Date(comment.published * 1000).toISOString() : new Date().toISOString(),
                },
              },
              totalReplyCount: comment.replies?.length || 0,
            },
            replies: comment.replies ? {
              comments: comment.replies.map((reply: any) => ({
                kind: "youtube#comment",
                id: reply.commentId || "",
                snippet: {
                  authorDisplayName: reply.author || "",
                  authorProfileImageUrl: reply.authorThumbnails?.[0]?.url || "",
                  textDisplay: reply.content || "",
                  textOriginal: reply.content || "",
                  likeCount: reply.likeCount || 0,
                  publishedAt: reply.published ? new Date(reply.published * 1000).toISOString() : new Date().toISOString(),
                },
              })),
            } : undefined,
          })),
        };

        return new Response(JSON.stringify(formatted), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (_) {
        // Try next provider
      }
    }

    // Fallback to Piped
    for (const base of getPipedBases()) {
      try {
        const url = `${base}/comments/${videoId}`;
        const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }, 8000);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) continue;
        const data = await res.json();
        if (!data || !Array.isArray(data.comments)) continue;

        // Format to match YouTube API response
        const formatted = {
          kind: "youtube#commentThreadListResponse",
          items: data.comments.slice(0, maxResults).map((comment: any) => ({
            kind: "youtube#commentThread",
            id: comment.commentId || "",
            snippet: {
              topLevelComment: {
                kind: "youtube#comment",
                id: comment.commentId || "",
                snippet: {
                  authorDisplayName: comment.author || "",
                  authorProfileImageUrl: comment.thumbnail || "",
                  textDisplay: comment.commentText || "",
                  textOriginal: comment.commentText || "",
                  likeCount: comment.likeCount || 0,
                  publishedAt: comment.commentedTime || new Date().toISOString(),
                },
              },
              totalReplyCount: comment.repliesPage ? 1 : 0,
            },
          })),
        };

        return new Response(JSON.stringify(formatted), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (_) {
        // Try next provider
      }
    }

    throw new Error("No comments provider returned valid data");
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
