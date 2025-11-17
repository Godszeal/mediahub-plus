import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ThumbsUp, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Short {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  likes: number;
  userLiked: boolean;
}

const Shorts = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const queries = [
          "#shorts christian gospel music viral",
          "funny christian shorts",
          "christian skits shorts",
          "gospel music shorts",
          "christian comedy shorts"
        ];
        
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        const { data, error } = await supabase.functions.invoke("youtube-search", {
          body: { 
            query: randomQuery,
            maxResults: 20,
            type: "video",
            videoDuration: "short"
          },
        });

        if (error) throw error;

        const videoIds = data.items?.map((item: any) => item.id.videoId) || [];
        
        // Fetch likes for each video
        const likesData = await Promise.all(
          videoIds.map(async (videoId: string) => {
            const { count } = await supabase
              .from("video_likes")
              .select("*", { count: "exact", head: true })
              .eq("video_id", videoId);
            
            const userLiked = user ? await supabase
              .from("video_likes")
              .select("id")
              .eq("video_id", videoId)
              .eq("user_id", user.id)
              .single() : null;

            return { videoId, likes: count || 0, userLiked: !!userLiked?.data };
          })
        );

        const formattedShorts: Short[] = data.items?.map((item: any, index: number) => {
          const likeInfo = likesData.find(l => l.videoId === item.id.videoId);
          return {
            id: `${index}`,
            videoId: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url,
            likes: likeInfo?.likes || 0,
            userLiked: likeInfo?.userLiked || false,
          };
        }) || [];

        setShorts(formattedShorts);
      } catch (error) {
        toast.error("Failed to load shorts");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchShorts();
  }, [user]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const windowHeight = container.clientHeight;
      const newIndex = Math.round(scrollPosition / windowHeight);
      
      if (newIndex !== currentIndex && newIndex < shorts.length) {
        // Pause previous video
        const prevIframe = iframeRefs.current[currentIndex];
        if (prevIframe?.contentWindow) {
          prevIframe.contentWindow.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            '*'
          );
        }
        
        setCurrentIndex(newIndex);
        
        // Auto-play new video
        const newIframe = iframeRefs.current[newIndex];
        if (newIframe?.contentWindow) {
          newIframe.contentWindow.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            '*'
          );
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, shorts.length]);

  const handleLike = async (short: Short, index: number) => {
    if (!user) {
      toast.error("Please login to like videos");
      navigate("/auth");
      return;
    }

    try {
      if (short.userLiked) {
        await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", short.videoId)
          .eq("user_id", user.id);

        setShorts(prev => prev.map((s, i) => 
          i === index ? { ...s, likes: s.likes - 1, userLiked: false } : s
        ));
      } else {
        await supabase
          .from("video_likes")
          .insert({
            video_id: short.videoId,
            user_id: user.id,
          });

        setShorts(prev => prev.map((s, i) => 
          i === index ? { ...s, likes: s.likes + 1, userLiked: true } : s
        ));
      }
    } catch (error) {
      toast.error("Failed to like video");
      console.error(error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <p className="text-muted-foreground">Loading shorts...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div 
        ref={containerRef}
        className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {shorts.map((short, index) => (
          <div
            key={short.id}
            className="h-full snap-start relative flex items-center justify-center bg-black"
          >
            <iframe
              ref={el => iframeRefs.current[index] = el}
              src={`https://www.youtube.com/embed/${short.videoId}?autoplay=${index === currentIndex ? 1 : 0}&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
              title={short.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-[9/16] h-full max-h-[1920px] w-auto"
              style={{ maxWidth: "min(100vw, 1080px)" }}
            />

            {/* Info Overlay */}
            <div className="absolute bottom-24 md:bottom-12 left-4 right-24 text-white z-10">
              <h3 className="font-semibold mb-2 text-sm md:text-base line-clamp-2">{short.title}</h3>
              <p className="text-xs md:text-sm opacity-80">{short.channel}</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-24 md:bottom-12 right-4 flex flex-col gap-4 z-10">
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleLike(short, index)}
                  className={`rounded-full bg-secondary/20 hover:bg-secondary/40 ${
                    short.userLiked ? "text-primary" : "text-white"
                  }`}
                >
                  <ThumbsUp className="w-6 h-6" fill={short.userLiked ? "currentColor" : "none"} />
                </Button>
                <span className="text-white text-xs font-semibold">{formatNumber(short.likes)}</span>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
              >
                <Share2 className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
              >
                <MoreVertical className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Shorts;
