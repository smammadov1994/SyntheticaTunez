-- ==========================================
-- ADD VIDEO URL COLUMN TO TRACKS TABLE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Add video_url column to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.tracks.video_url IS 'URL to the generated music video (optional, 4-second loops)';

-- Create index for faster filtering of tracks with videos
CREATE INDEX IF NOT EXISTS tracks_video_url_idx ON public.tracks(video_url) WHERE video_url IS NOT NULL;
