import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ThumbsUp, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Short {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

const Shorts = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        // Search for short videos (typically under 60 seconds)
        const { data, error } = await supabase.functions.invoke("youtube-search", {
          body: { 
            query: "shorts christian gospel music trending",
            maxResults: 20,
            type: "video"
          },
        });

        if (error) throw error;

        const formattedShorts: Short[] = data.items?.map((item: any, index: number) => ({
          id: `${index}`,
          videoId: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url,
        })) || [];

        setShorts(formattedShorts);
      } catch (error) {
        toast.error("Failed to load shorts");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchShorts();
  }, []);

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

      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        {shorts.map((short) => (
          <div
            key={short.id}
            className="h-full snap-start relative flex items-center justify-center bg-black"
          >
            <iframe
              src={`https://www.youtube.com/embed/${short.videoId}?autoplay=0&controls=1&modestbranding=1`}
              title={short.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full max-w-md object-contain"
            />

            {/* Info Overlay */}
            <div className="absolute bottom-20 md:bottom-8 left-4 right-20 text-white z-10">
              <h3 className="font-semibold mb-2">{short.title}</h3>
              <p className="text-sm opacity-80">{short.channel}</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-20 md:bottom-8 right-4 flex flex-col gap-6 z-10">
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
                >
                  <ThumbsUp className="w-6 h-6" />
                </Button>
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
