import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2, Download as DownloadIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const Downloads = () => {
  const { user } = useAuth();

  const { data: downloads, isLoading, refetch } = useQuery({
    queryKey: ["downloads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downloads")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("downloads").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete download");
    } else {
      toast.success("Download deleted");
      refetch();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">My Downloads</h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : downloads && downloads.length > 0 ? (
            <div className="space-y-4">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className="bg-card rounded-xl p-4 flex items-center gap-4"
                >
                  {download.video_thumbnail && (
                    <img
                      src={download.video_thumbnail}
                      alt={download.video_title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 line-clamp-1">
                      {download.video_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {download.channel_name}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {download.download_type === "video" ? "Video" : "Audio"} •{" "}
                        {download.quality}
                      </span>
                      {download.status === "downloading" && (
                        <Progress value={download.progress} className="w-32" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          download.status === "completed"
                            ? "text-green-500"
                            : download.status === "failed"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {download.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(download.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DownloadIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No downloads yet</p>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
};

export default Downloads;
