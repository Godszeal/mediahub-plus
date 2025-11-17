import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { MovieCarousel } from "@/components/MovieCarousel";
import { Sidebar } from "@/components/Sidebar";
import { categories } from "@/data/mockVideos";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "@/types/video";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [videosByCategory, setVideosByCategory] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(true);
  const [carouselVideos, setCarouselVideos] = useState<Record<string, Video[]>>({});

  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const query = activeCategory === "all" ? "trending christian movies" : activeCategory;
        const { data, error } = await supabase.functions.invoke(
          activeCategory === "all" ? "youtube-trending" : "youtube-search",
          {
            body: activeCategory === "all" ? {} : { query, maxResults: 20 },
          }
        );

        if (error) throw error;

        const formatted: Video[] = data.items?.map((item: any) => ({
          id: item.id.videoId || item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelName: item.snippet.channelTitle,
          channelAvatar: "",
          views: 0,
          uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
          duration: "0:00",
          description: item.snippet.description,
          category: activeCategory,
        })) || [];

        setVideosByCategory({ [activeCategory]: formatted });
      } catch (error) {
        toast.error("Failed to load videos");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [activeCategory]);

  useEffect(() => {
    const fetchCarouselVideos = async () => {
      try {
        const categoriesToFetch = ["gospel music", "nollywood", "mount zion movies"];
        const promises = categoriesToFetch.map(async (cat) => {
          const { data } = await supabase.functions.invoke("youtube-search", {
            body: { query: cat, maxResults: 10 },
          });
          
          const formatted: Video[] = data?.items?.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelName: item.snippet.channelTitle,
            channelAvatar: "",
            views: 0,
            uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
            duration: "0:00",
            description: item.snippet.description,
            category: cat,
          })) || [];

          return { category: cat, videos: formatted };
        });

        const results = await Promise.all(promises);
        const carouselData: Record<string, Video[]> = {};
        results.forEach(({ category, videos }) => {
          carouselData[category] = videos;
        });
        setCarouselVideos(carouselData);
      } catch (error) {
        console.error("Failed to load carousel videos:", error);
      }
    };

    fetchCarouselVideos();
  }, []);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSearchParams(category === "all" ? {} : { category });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 pb-20 md:pb-0">
        <TopNav />

        <div className="container mx-auto px-4 py-6">
          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <Button
              variant={activeCategory === "all" ? "default" : "secondary"}
              onClick={() => handleCategoryChange("all")}
              className="rounded-full whitespace-nowrap"
            >
              All
            </Button>
            {categories.slice(1).map((category) => (
              <Button
                key={category}
                variant={activeCategory === category.toLowerCase() ? "default" : "secondary"}
                onClick={() => handleCategoryChange(category.toLowerCase())}
                className="rounded-full whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Movie Carousels */}
          {activeCategory === "all" && (
            <div className="mb-8 space-y-6">
              {Object.entries(carouselVideos).map(([category, videos]) => (
                <MovieCarousel
                  key={category}
                  title={category.charAt(0).toUpperCase() + category.slice(1)}
                  videos={videos}
                />
              ))}
            </div>
          )}

          {/* Videos Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videosByCategory[activeCategory]?.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Index;
