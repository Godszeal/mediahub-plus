import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Download, History, Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [downloadQuality, setDownloadQuality] = useState("HD");
  const [autoPlay, setAutoPlay] = useState(true);
  const [subtitles, setSubtitles] = useState("English");

  const handleDownloads = () => {
    navigate("/downloads");
  };

  const handleWatchHistory = () => {
    navigate("/watch-history");
  };

  const handleWatchLater = () => {
    navigate("/watch-later");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {user?.user_metadata?.username || user?.email?.split("@")[0]}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Button
                variant="secondary"
                className="h-24 flex-col gap-2"
                onClick={handleDownloads}
              >
                <Download className="w-6 h-6" />
                <span>Downloads</span>
              </Button>
              <Button
                variant="secondary"
                className="h-24 flex-col gap-2"
                onClick={handleWatchHistory}
              >
                <History className="w-6 h-6" />
                <span>Watch History</span>
              </Button>
              <Button
                variant="secondary"
                className="h-24 flex-col gap-2"
                onClick={handleWatchLater}
              >
                <Clock className="w-6 h-6" />
                <span>Watch Later</span>
              </Button>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <div className="bg-card rounded-xl p-4 space-y-6">
                <div className="flex justify-between items-center">
                  <span>Download Quality</span>
                  <Select value={downloadQuality} onValueChange={setDownloadQuality}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4K">4K</SelectItem>
                      <SelectItem value="HD">HD</SelectItem>
                      <SelectItem value="SD">SD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auto-play</span>
                  <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Subtitles</span>
                  <Select value={subtitles} onValueChange={setSubtitles}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
