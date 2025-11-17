import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "@/types/video";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-search", {
        body: { query: searchQuery, maxResults: 20 },
      });

      if (error) throw error;

      const formattedVideos: Video[] = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelName: item.snippet.channelTitle,
        channelAvatar: "",
        views: 0,
        uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
        duration: "0:00",
        description: item.snippet.description,
      })) || [];

      setVideos(formattedVideos);
    } catch (error) {
      toast.error("Failed to search videos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={onSubmitSearch} className="mb-6 md:hidden">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search videos, channels..."
              className="w-full pr-12"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </form>

        {query && (
          <h2 className="text-xl font-semibold mb-6">
            Search results for "{query}"
          </h2>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {videos.length === 0 && query && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos found</p>
              </div>
            )}

            {!query && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Enter a search query to find videos</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;
