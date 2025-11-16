export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelAvatar: string;
  views: number;
  uploadedAt: string;
  duration: string;
  description?: string;
  likes?: number;
  subscribers?: number;
  category: string;
}

export interface Playlist {
  id: string;
  title: string;
  videos: Video[];
}
