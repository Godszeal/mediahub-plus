import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { CategorySection } from "@/components/CategorySection";
import { trendingVideos, categories } from "@/data/mockVideos";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Group videos by category for display
  const videosByCategory = {
    Trending: trendingVideos.filter((v) => v.category !== "News"),
    "Christian Movies": trendingVideos.filter((v) => v.category === "Christian Movies"),
    "Hot Movies": trendingVideos.slice(0, 4),
    "South Africa Drama": trendingVideos.filter((v) => v.category === "South Africa Drama"),
    "Korea Drama": trendingVideos.filter((v) => v.category === "Korea Drama"),
    "Tanzania Drama": trendingVideos.filter((v) => v.category === "Tanzania Drama"),
    Music: trendingVideos.filter((v) => v.category === "Music"),
    News: trendingVideos.filter((v) => v.category === "News"),
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
        {Object.entries(videosByCategory).map(
          ([category, videos]) =>
            videos.length > 0 && (
              <CategorySection key={category} title={category} videos={videos} />
            )
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
