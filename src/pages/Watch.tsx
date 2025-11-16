import { useParams } from "react-router-dom";
import { trendingVideos } from "@/data/mockVideos";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ThumbsUp, Share2, Download, Flag, Eye, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { Separator } from "@/components/ui/separator";

const Watch = () => {
  const { id } = useParams();
  const video = trendingVideos.find((v) => v.id === id);

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const recommendedVideos = trendingVideos.filter((v) => v.id !== id).slice(0, 6);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="icon" className="w-16 h-16 rounded-full">
                  <Play className="w-8 h-8" />
                </Button>
              </div>
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

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  {formatNumber(video.likes || 0)}
                </Button>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
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
            <div className="bg-secondary p-4 rounded-xl">
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
              <div className="text-center py-8 text-muted-foreground">
                <p>Comments section coming soon</p>
              </div>
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
