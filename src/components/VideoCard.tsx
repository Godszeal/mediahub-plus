import { Video } from "@/types/video";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VideoCardProps {
  video: Video;
}

export const VideoCard = ({ video }: VideoCardProps) => {
  const navigate = useNavigate();

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div
      onClick={() => navigate(`/watch/${video.id}`)}
      className="group cursor-pointer transition-smooth"
    >
      <div className="relative rounded-xl overflow-hidden mb-3 bg-card">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full aspect-video object-cover group-hover:scale-105 transition-smooth"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
          {video.duration}
        </div>
      </div>

      <div className="flex gap-3">
        <img
          src={video.channelAvatar}
          alt={video.channelName}
          className="w-9 h-9 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-smooth">
            {video.title}
          </h3>
          <p className="text-muted-foreground text-xs mb-1">{video.channelName}</p>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatViews(video.views)} views</span>
            </div>
            <span>•</span>
            <span>{video.uploadedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
