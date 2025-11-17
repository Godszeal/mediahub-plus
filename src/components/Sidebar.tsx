import { Home, PlaySquare, Search, TrendingUp, Clock, Download, History, Film } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: TrendingUp, label: "Trending", path: "/?category=trending" },
    { icon: PlaySquare, label: "Shorts", path: "/shorts" },
    { icon: Search, label: "Search", path: "/search" },
  ];

  const libraryNav = [
    { icon: History, label: "Watch History", path: "/watch-history" },
    { icon: Clock, label: "Watch Later", path: "/watch-later" },
    { icon: Download, label: "Downloads", path: "/downloads" },
  ];

  const categories = [
    { label: "Gospel Music", path: "/?category=gospel" },
    { label: "Mount Zion Movies", path: "/?category=mount-zion" },
    { label: "Nollywood", path: "/?category=nollywood" },
    { label: "Teen Nollywood", path: "/?category=teen-nollywood" },
    { label: "Christian Movies", path: "/?category=christian-movies" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path.includes("?") && location.search.includes(item.path.split("?")[1]));
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="px-3 text-sm font-semibold text-muted-foreground">Library</h3>
          {libraryNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="px-3 text-sm font-semibold text-muted-foreground">Categories</h3>
          {categories.map((item) => {
            const isActive = location.search.includes(item.path.split("?")[1]);
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <Film className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
