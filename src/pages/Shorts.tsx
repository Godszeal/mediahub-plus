import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ThumbsUp, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const Shorts = () => {
  const shorts = [
    {
      id: 1,
      video: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=700&fit=crop",
      title: "Amazing Gospel Performance",
      channel: "Worship Channel",
      likes: "125K",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory">
        {shorts.map((short) => (
          <div
            key={short.id}
            className="h-full snap-start relative flex items-center justify-center bg-black"
          >
            <img
              src={short.video}
              alt={short.title}
              className="h-full w-auto max-w-full object-contain"
            />

            {/* Info Overlay */}
            <div className="absolute bottom-20 md:bottom-8 left-4 right-20 text-white z-10">
              <h3 className="font-semibold mb-2">{short.title}</h3>
              <p className="text-sm opacity-80">{short.channel}</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-20 md:bottom-8 right-4 flex flex-col gap-6 z-10">
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
                >
                  <ThumbsUp className="w-6 h-6" />
                </Button>
                <span className="text-xs text-white font-medium">{short.likes}</span>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
              >
                <Share2 className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-secondary/20 hover:bg-secondary/40 text-white"
              >
                <MoreVertical className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Shorts;
