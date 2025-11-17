-- Create video_likes table to track user likes
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for video_likes
CREATE POLICY "Anyone can view video likes"
ON public.video_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own video likes"
ON public.video_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video likes"
ON public.video_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create user_preferences table for settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  download_quality TEXT DEFAULT 'high',
  auto_play BOOLEAN DEFAULT true,
  subtitles BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);