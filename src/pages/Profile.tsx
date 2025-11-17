import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Clock, History, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [downloadQuality, setDownloadQuality] = useState("high");
  const [autoPlay, setAutoPlay] = useState(true);
  const [subtitles, setSubtitles] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setDownloadQuality(data.download_quality || "high");
          setAutoPlay(data.auto_play ?? true);
          setSubtitles(data.subtitles ?? false);
          setTheme(data.theme === "light" ? "light" : "dark");
        } else {
          await supabase.from("user_preferences").insert({
            user_id: user.id,
            download_quality: "high",
            auto_play: true,
            subtitles: false,
            theme: "dark",
          });
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const updatePreference = async (field: string, value: any) => {
    if (!user) return;

    try {
      await supabase
        .from("user_preferences")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } catch (error) {
      toast.error("Failed to update preferences");
      console.error(error);
    }
  };

  const handleQualityChange = (value: string) => {
    setDownloadQuality(value);
    updatePreference("download_quality", value);
  };

  const handleAutoPlayChange = (checked: boolean) => {
    setAutoPlay(checked);
    updatePreference("auto_play", checked);
  };

  const handleSubtitlesChange = (checked: boolean) => {
    setSubtitles(checked);
    updatePreference("subtitles", checked);
  };

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    updatePreference("theme", newTheme);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Profile Header */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold mb-2">{user?.email}</h1>
                <p className="text-muted-foreground">
                  Member since {new Date(user?.created_at || "").toLocaleDateString()}
                </p>
              </div>
              <Button variant="destructive" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button
              variant="secondary"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/downloads")}
            >
              <Download className="w-6 h-6" />
              <span>Downloads</span>
            </Button>
            <Button
              variant="secondary"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/watch-history")}
            >
              <History className="w-6 h-6" />
              <span>Watch History</span>
            </Button>
            <Button
              variant="secondary"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/watch-later")}
            >
              <Clock className="w-6 h-6" />
              <span>Watch Later</span>
            </Button>
          </div>

          {/* Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5" />
              <h2 className="text-xl font-bold">Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">Download Quality</Label>
                <Select value={downloadQuality} onValueChange={handleQualityChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="autoplay">Auto-play</Label>
                <Switch
                  id="autoplay"
                  checked={autoPlay}
                  onCheckedChange={handleAutoPlayChange}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="subtitles">Subtitles</Label>
                <Switch
                  id="subtitles"
                  checked={subtitles}
                  onCheckedChange={handleSubtitlesChange}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Dark Mode
                </Label>
                <Switch
                  id="theme"
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeChange}
                />
              </div>
            </div>
          </Card>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
