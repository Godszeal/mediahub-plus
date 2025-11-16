import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { trendingVideos } from "@/data/mockVideos";
import { useSearchParams } from "react-router-dom";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const filteredVideos = query
    ? trendingVideos.filter(
        (video) =>
          video.title.toLowerCase().includes(query.toLowerCase()) ||
          video.channelName.toLowerCase().includes(query.toLowerCase())
      )
    : trendingVideos;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      <div className="container mx-auto px-4 py-6">
        {query && (
          <h2 className="text-xl font-semibold mb-6">
            Search results for "{query}"
          </h2>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No videos found</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;
