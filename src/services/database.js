import { supabase } from '../utils/supabase';

// ==================== PROFILES ====================

/**
 * Get the current user's profile
 */
export const getCurrentProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

/**
 * Get a profile by user ID
 */
export const getProfileById = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
};

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (username) => {
  if (!username || username.length < 3) return false;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  return !data; // Returns true if no user found (available)
};

/**
 * Complete onboarding for a user
 */
export const completeOnboarding = async (username, bio, avatarUrl) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const updates = {
    username,
    bio,
    avatar_url: avatarUrl,
    is_onboarded: true,
    updated_at: new Date(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }

  return true;
};

// ==================== TRACKS ====================

/**
 * Get all tracks for the current user (their library)
 */
export const getUserTracks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      profiles:user_id (username, avatar_url),
      likes:track_likes (count),
      comments:track_comments (count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }

  return data || [];
};

/**
 * Get a single track by ID with full details
 */
export const getTrackById = async (trackId) => {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url),
      likes:track_likes (user_id),
      comments:track_comments (
        id,
        content,
        created_at,
        profiles:user_id (id, username, avatar_url)
      )
    `)
    .eq('id', trackId)
    .single();

  if (error) {
    console.error('Error fetching track:', error);
    return null;
  }

  return data;
};

/**
 * Create a new track
 */
export const createTrack = async (trackData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('tracks')
    .insert({
      ...trackData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating track:', error);
    return null;
  }

  return data;
};

/**
 * Delete a track
 */
export const deleteTrack = async (trackId) => {
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId);

  if (error) {
    console.error('Error deleting track:', error);
    return false;
  }

  return true;
};

// ==================== LIKES ====================

/**
 * Check if current user has liked a track
 */
export const hasUserLikedTrack = async (trackId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('track_likes')
    .select('id')
    .eq('track_id', trackId)
    .eq('user_id', user.id)
    .maybeSingle();

  return !error && data !== null;
};

/**
 * Like a track
 */
export const likeTrack = async (trackId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('track_likes')
    .insert({
      track_id: trackId,
      user_id: user.id,
    });

  if (error) {
    console.error('Error liking track:', error);
    return false;
  }

  return true;
};

/**
 * Unlike a track
 */
export const unlikeTrack = async (trackId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('track_likes')
    .delete()
    .eq('track_id', trackId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unliking track:', error);
    return false;
  }

  return true;
};

/**
 * Get like count for a track
 */
export const getTrackLikeCount = async (trackId) => {
  const { count, error } = await supabase
    .from('track_likes')
    .select('*', { count: 'exact', head: true })
    .eq('track_id', trackId);

  if (error) {
    console.error('Error getting like count:', error);
    return 0;
  }

  return count || 0;
};

// ==================== COMMENTS ====================

/**
 * Get comments for a track
 */
export const getTrackComments = async (trackId) => {
  const { data, error } = await supabase
    .from('track_comments')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url)
    `)
    .eq('track_id', trackId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
};

/**
 * Add a comment to a track
 */
export const addComment = async (trackId, content) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('track_comments')
    .insert({
      track_id: trackId,
      user_id: user.id,
      content,
    })
    .select(`
      *,
      profiles:user_id (id, username, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }

  return data;
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from('track_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return false;
  }

  return true;
};

// ==================== FRIENDS ====================

/**
 * Get current user's friends
 */
export const getFriends = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      friend:friend_id (id, username, avatar_url, bio)
    `)
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  return data?.map(f => f.friend) || [];
};

/**
 * Get pending friend requests (received)
 */
export const getPendingFriendRequests = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      requester:user_id (id, username, avatar_url)
    `)
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }

  return data || [];
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (friendId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending',
    });

  if (error) {
    console.error('Error sending friend request:', error);
    return false;
  }

  return true;
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Update the existing request to accepted
  const { data: request, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    console.error('Error fetching request:', fetchError);
    return false;
  }

  // Update to accepted
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateError) {
    console.error('Error accepting request:', updateError);
    return false;
  }

  // Create reverse friendship
  const { error: insertError } = await supabase
    .from('friendships')
    .insert({
      user_id: request.friend_id,
      friend_id: request.user_id,
      status: 'accepted',
    });

  if (insertError) {
    console.error('Error creating reverse friendship:', insertError);
  }

  return true;
};

/**
 * Decline/Remove a friend
 */
export const removeFriend = async (friendId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Remove both directions
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  if (error) {
    console.error('Error removing friend:', error);
    return false;
  }

  return true;
};

// ==================== COMMUNITY FEED ====================

/**
 * Get tracks by artist (for community feed)
 */
export const getTracksByArtist = async (limit = 10) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      tracks (
        id,
        title,
        artwork_url,
        genre,
        created_at
      )
    `)
    .not('tracks', 'is', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching tracks by artist:', error);
    return [];
  }

  // Filter out users with no tracks
  return data?.filter(user => user.tracks && user.tracks.length > 0) || [];
};

/**
 * Get tracks by genre (for community feed)
 */
export const getTracksByGenre = async () => {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tracks by genre:', error);
    return [];
  }

  // Group by genre
  const genreMap = {};
  data?.forEach(track => {
    const genre = track.genre || 'Other';
    if (!genreMap[genre]) {
      genreMap[genre] = [];
    }
    genreMap[genre].push(track);
  });

  return Object.entries(genreMap).map(([genre, tracks]) => ({
    id: genre,
    title: genre,
    items: tracks,
  }));
};

// ==================== SEARCH ====================

/**
 * Search users by username
 */
export const searchUsers = async (query) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')
    .ilike('username', `%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
};

/**
 * Search tracks by title
 */
export const searchTracks = async (query) => {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url)
    `)
    .ilike('title', `%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching tracks:', error);
    return [];
  }

  return data || [];
};


