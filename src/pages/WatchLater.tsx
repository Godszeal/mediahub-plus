import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Video } from "@/types/video";

const WatchLater = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchLater = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("watch_later")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedVideos: Video[] = data.map((item) => ({
          id: item.video_id,
          title: item.video_title,
          thumbnail: item.video_thumbnail || "",
          channelName: item.channel_name || "",
          channelAvatar: "",
          views: 0,
          uploadedAt: new Date(item.created_at || "").toLocaleDateString(),
          duration: "0:00",
          category: "Watch Later",
        }));

        setVideos(formattedVideos);
      } catch (error) {
        toast.error("Failed to load watch later videos");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchLater();
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Watch Later</h1>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos in watch later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
};

export default WatchLater;
