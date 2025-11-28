-- ==========================================
-- SYNTHETICATUNEZ DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    'https://i.pravatar.cc/150?u=' || NEW.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRACKS TABLE
-- User generated music tracks
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT,
  genre TEXT,
  lyrics TEXT,
  artwork_url TEXT,
  audio_url TEXT,
  duration INTEGER, -- in seconds
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Policies for tracks
CREATE POLICY "Public tracks are viewable by everyone"
  ON public.tracks FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks"
  ON public.tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON public.tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON public.tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS tracks_user_id_idx ON public.tracks(user_id);
CREATE INDEX IF NOT EXISTS tracks_genre_idx ON public.tracks(genre);
CREATE INDEX IF NOT EXISTS tracks_created_at_idx ON public.tracks(created_at DESC);

-- ==========================================
-- TRACK LIKES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.track_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);

-- Enable RLS
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.track_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like tracks"
  ON public.track_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tracks"
  ON public.track_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS track_likes_track_id_idx ON public.track_likes(track_id);
CREATE INDEX IF NOT EXISTS track_likes_user_id_idx ON public.track_likes(user_id);

-- ==========================================
-- TRACK COMMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.track_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.track_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can add comments"
  ON public.track_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.track_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.track_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS track_comments_track_id_idx ON public.track_comments(track_id);
CREATE INDEX IF NOT EXISTS track_comments_user_id_idx ON public.track_comments(user_id);

-- ==========================================
-- FRIENDSHIPS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policies for friendships
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Indexes
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS friendships_status_idx ON public.friendships(status);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get track like count
CREATE OR REPLACE FUNCTION get_track_like_count(track_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.track_likes WHERE track_id = track_uuid;
$$ LANGUAGE sql STABLE;

-- Function to get track comment count
CREATE OR REPLACE FUNCTION get_track_comment_count(track_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.track_comments WHERE track_id = track_uuid;
$$ LANGUAGE sql STABLE;

-- Function to check if user liked a track
CREATE OR REPLACE FUNCTION user_liked_track(track_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.track_likes 
    WHERE track_id = track_uuid AND user_id = user_uuid
  );
$$ LANGUAGE sql STABLE;

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracks_updated_at ON public.tracks;
CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_track_comments_updated_at ON public.track_comments;
CREATE TRIGGER update_track_comments_updated_at
  BEFORE UPDATE ON public.track_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

