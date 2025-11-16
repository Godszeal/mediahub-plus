import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Download, History, Clock } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">User Profile</h1>
              <p className="text-muted-foreground">Manage your content and preferences</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Button variant="secondary" className="h-24 flex-col gap-2">
              <Download className="w-6 h-6" />
              <span>Downloads</span>
            </Button>
            <Button variant="secondary" className="h-24 flex-col gap-2">
              <History className="w-6 h-6" />
              <span>Watch History</span>
            </Button>
            <Button variant="secondary" className="h-24 flex-col gap-2">
              <Clock className="w-6 h-6" />
              <span>Watch Later</span>
            </Button>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Settings</h2>
            <div className="bg-card rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span>Download Quality</span>
                <Button variant="ghost" size="sm">
                  HD
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Auto-play</span>
                <Button variant="ghost" size="sm">
                  On
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Subtitles</span>
                <Button variant="ghost" size="sm">
                  English
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
