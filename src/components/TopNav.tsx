import { Search, Menu, Play } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const TopNav = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between gap-4 px-4 h-16">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 fill-primary-foreground text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:block">StreamHub</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex">
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search videos, channels..."
              className="w-full pr-12 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => navigate("/search")}
        >
          <Search className="w-6 h-6" />
        </Button>
      </div>
    </header>
  );
};
