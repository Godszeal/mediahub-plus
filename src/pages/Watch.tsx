import { useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { CommentSection } from "@/components/CommentSection";
import { ThumbsUp, Share2, Download, Flag, Eye, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video } from "@/types/video";

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("youtube-video-details", {
          body: { videoId: id },
        });

        if (error) throw error;

        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const videoData: Video = {
            id: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.high.url,
            channelName: item.snippet.channelTitle,
            channelAvatar: "",
            views: parseInt(item.statistics.viewCount || "0"),
            uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
            duration: "0:00",
            description: item.snippet.description,
            likes: parseInt(item.statistics.likeCount || "0"),
            category: item.snippet.categoryId,
          };
          setVideo(videoData);

          // Track watch history
          if (user) {
            await supabase.from("watch_history").upsert({
              user_id: user.id,
              video_id: videoData.id,
              video_title: videoData.title,
              video_thumbnail: videoData.thumbnail,
              channel_name: videoData.channelName,
              last_watched_at: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        toast.error("Failed to load video");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id, user]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Fetch user's watch history to get personalized recommendations
        let categoryToSearch = "trending";
        
        if (user) {
          const { data: history } = await supabase
            .from("watch_history")
            .select("video_id")
            .eq("user_id", user.id)
            .order("last_watched_at", { ascending: false })
            .limit(10);

          if (history && history.length > 0) {
            // Use the most watched video category for recommendations
            const { data: videoDetails } = await supabase.functions.invoke("youtube-video-details", {
              body: { videoId: history[0].video_id },
            });
            
            if (videoDetails?.items?.[0]) {
              categoryToSearch = videoDetails.items[0].snippet.categoryId;
            }
          }
        }

        const { data, error } = await supabase.functions.invoke("youtube-search", {
          body: { query: categoryToSearch, maxResults: 12 },
        });

        if (error) throw error;

        const formatted: Video[] = data.items?.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelName: item.snippet.channelTitle,
          channelAvatar: "",
          views: 0,
          uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
          duration: "0:00",
          description: item.snippet.description,
          category: "",
        })) || [];

        setRecommendedVideos(formatted.filter((v) => v.id !== id));
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      }
    };

    if (video) {
      fetchRecommendations();
    }
  }, [video, id, user]);

  const handleDownload = async (type: "video" | "audio") => {
    if (!user) {
      toast.error("Please login to download");
      navigate("/auth");
      return;
    }

    if (!video) return;

    try {
      const { error } = await supabase.functions.invoke("initiate-download", {
        body: {
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnail,
          channelName: video.channelName,
          downloadType: type,
          quality: "high",
        },
      });

      if (error) throw error;

      toast.success(`${type === "video" ? "Video" : "Audio"} download started!`);
      navigate("/downloads");
    } catch (error) {
      toast.error("Failed to start download");
      console.error(error);
    }
  };

  const handleWatchLater = async () => {
    if (!user) {
      toast.error("Please login to save videos");
      navigate("/auth");
      return;
    }

    if (!video) return;

    try {
      const { error } = await supabase.from("watch_later").insert({
        user_id: user.id,
        video_id: video.id,
        video_title: video.title,
        video_thumbnail: video.thumbnail,
        channel_name: video.channelName,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Already in Watch Later");
        } else {
          throw error;
        }
      } else {
        toast.success("Added to Watch Later");
      }
    } catch (error) {
      toast.error("Failed to save video");
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
          <p className="text-muted-foreground">Loading video...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <p className="text-muted-foreground">Video not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Info */}
            <h1 className="text-xl md:text-2xl font-bold mb-4">{video.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={video.channelAvatar}
                  alt={video.channelName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold">{video.channelName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(video.subscribers || 0)} subscribers
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  {formatNumber(video.likes || 0)}
                </Button>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDownload("video")}
                >
                  <Download className="w-4 h-4" />
                  Video
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDownload("audio")}
                >
                  <Download className="w-4 h-4" />
                  Audio
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={handleWatchLater}
                >
                  <Clock className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{formatNumber(video.views)} views</span>
              </div>
              <span>•</span>
              <span>{video.uploadedAt}</span>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="bg-secondary p-4 rounded-xl mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {video.description ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Comments Section */}
            <div>
              <h3 className="font-semibold mb-4">Comments</h3>
              <CommentSection videoId={video.id} />
            </div>
          </div>

          {/* Recommended Videos */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold mb-4">Recommended</h3>
            <div className="space-y-4">
              {recommendedVideos.map((recVideo) => (
                <VideoCard key={recVideo.id} video={recVideo} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Watch;
