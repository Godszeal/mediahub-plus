import { Video } from "@/types/video";
import { VideoCard } from "./VideoCard";

interface CategorySectionProps {
  title: string;
  videos: Video[];
}

export const CategorySection = ({ title, videos }: CategorySectionProps) => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
};
