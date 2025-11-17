import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { CategorySection } from "@/components/CategorySection";
import { categories } from "@/data/mockVideos";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "@/types/video";
import { toast } from "sonner";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        let query = "";
        let useSearch = false;

        // Map categories to search queries
        switch (activeCategory) {
          case "Trending":
            // Use trending endpoint
            break;
          case "Christian Movies":
            query = "christian movies full 2024";
            useSearch = true;
            break;
          case "Mount Zion Movies":
            query = "mount zion movies latest 2024";
            useSearch = true;
            break;
          case "Nollywood":
            query = "nollywood movies latest 2024";
            useSearch = true;
            break;
          case "Teen Nollywood":
            query = "teen nollywood movies 2024";
            useSearch = true;
            break;
          case "Hot Movies":
            query = "trending movies 2024";
            useSearch = true;
            break;
          case "South Africa Drama":
            query = "south african drama series 2024";
            useSearch = true;
            break;
          case "Korea Drama":
            query = "korean drama 2024";
            useSearch = true;
            break;
          case "Tanzania Drama":
            query = "tanzania drama series 2024";
            useSearch = true;
            break;
          case "Music":
            query = "gospel music latest 2024";
            useSearch = true;
            break;
          case "Music Videos":
            query = "gospel music videos 2024";
            useSearch = true;
            break;
          case "News":
            query = "christian news today";
            useSearch = true;
            break;
          case "Recommended":
            query = "recommended christian content";
            useSearch = true;
            break;
          default:
            useSearch = true;
            query = activeCategory;
        }

        if (useSearch) {
          const { data, error } = await supabase.functions.invoke("youtube-search", {
            body: { query, maxResults: 25 },
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
            category: activeCategory,
          })) || [];

          setVideos(formattedVideos);
        } else {
          const { data, error } = await supabase.functions.invoke("youtube-trending", {
            body: { regionCode: "US", maxResults: 50 },
          });

          if (error) throw error;

          const formattedVideos: Video[] = data.items?.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelName: item.snippet.channelTitle,
            channelAvatar: "",
            views: parseInt(item.statistics.viewCount || "0"),
            uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
            duration: "0:00",
            description: item.snippet.description,
            likes: parseInt(item.statistics.likeCount || "0"),
            category: "Trending",
          })) || [];

          setVideos(formattedVideos);
        }
      } catch (error) {
        toast.error("Failed to load videos");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchVideos();
  }, [activeCategory]);

  const scroll = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const videosByCategory = {
    [activeCategory]: videos,
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      {/* Category Pills */}
      <div className="sticky top-16 z-40 bg-background border-b border-border">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={categoryScrollRef}
            className="overflow-x-auto scrollbar-hide px-4 md:px-12"
          >
            <div className="flex gap-3 py-4 min-w-max">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : (
          Object.entries(videosByCategory).map(
            ([category, categoryVideos]) =>
              categoryVideos.length > 0 && (
                <CategorySection key={category} title={category} videos={categoryVideos} />
              )
          )
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
