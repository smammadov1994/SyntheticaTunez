import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  SlideInRight
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { PlaybackControls } from '../components/PlaybackControls';
import { 
  getTrackById, 
  likeTrack, 
  unlikeTrack, 
  hasUserLikedTrack,
  getTrackComments,
  addComment,
  getTrackLikeCount
} from '../services/database';
import { supabase } from '../utils/supabase';
import { theme } from '../theme';

export const NowPlayingScreen = ({ navigation, route }) => {
  const trackId = route.params?.trackId;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);

  const soundRef = useRef(null);
  const heartScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const fetchTrackData = useCallback(async () => {
    if (!trackId) {
      setLoading(false);
      return;
    }

    try {
      const [trackData, liked, count, commentsData, { data: { user } }] = await Promise.all([
        getTrackById(trackId),
        hasUserLikedTrack(trackId),
        getTrackLikeCount(trackId),
        getTrackComments(trackId),
        supabase.auth.getUser(),
      ]);

      setTrack(trackData);
      setIsLiked(liked);
      setLikeCount(count);
      setComments(commentsData);
      setCurrentUserId(user?.id);
    } catch (error) {
      console.error('Error fetching track:', error);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchTrackData();
  }, [fetchTrackData]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Load and play audio
  const loadAndPlayAudio = async () => {
    if (!track?.audio_url) {
      console.warn('No audio URL available');
      return;
    }

    try {
      setAudioLoading(true);

      // If already loaded, just play/pause
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        setAudioLoading(false);
        return;
      }

      // Load new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.audio_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setAudioLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioLoading(false);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis / 1000);
      setAudioDuration(status.durationMillis / 1000 || track?.duration || 0);
      
      // Update progress bar
      if (status.durationMillis > 0) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        progressWidth.value = withTiming(progress, { duration: 100 });
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPosition(0);
        progressWidth.value = withTiming(0);
      }
    }
  };

  const handlePlayPause = async () => {
    await loadAndPlayAudio();
  };

  const seekTo = async (position) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position * 1000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleLikePress = async () => {
    if (!trackId) return;

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    // Animate heart
    heartScale.value = withSpring(1.3, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });

    // Actual update
    const success = wasLiked 
      ? await unlikeTrack(trackId)
      : await likeTrack(trackId);

    if (!success) {
      // Revert on failure
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !trackId || submittingComment) return;

    setSubmittingComment(true);
    const comment = await addComment(trackId, newComment.trim());
    
    if (comment) {
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
    setSubmittingComment(false);
  };

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = ({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.commentItem}
    >
      <Image
        source={{ uri: item.profiles?.avatar_url || 'https://i.pravatar.cc/150' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>@{item.profiles?.username || 'user'}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.black} />
        </View>
      </SafeAreaView>
    );
  }

  // Fallback data if no track loaded
  const displayTrack = track || {
    title: 'Unknown Track',
    artist_name: 'Unknown Artist',
    artwork_url: 'https://picsum.photos/600/600',
    duration: 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={32} color={theme.colors.gray.dark} />
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="shuffle-outline" size={24} color={theme.colors.gray.dark} />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="repeat-outline" size={24} color={theme.colors.gray.dark} />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleLikePress}>
              <Animated.View style={heartAnimatedStyle}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? theme.colors.error : theme.colors.gray.dark} 
                />
              </Animated.View>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => setShowComments(!showComments)}>
              <Ionicons 
                name={showComments ? "chatbubble" : "chatbubble-outline"} 
                size={22} 
                color={showComments ? theme.colors.accent : theme.colors.gray.dark} 
              />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color={theme.colors.gray.dark} />
            </Pressable>
          </View>
        </View>

        {!showComments ? (
          <View style={styles.content}>
            <View style={styles.artworkContainer}>
              <Image
                source={{ uri: displayTrack.artwork_url || 'https://picsum.photos/600/600' }}
                style={styles.artwork}
              />
            </View>

            <View style={styles.trackInfo}>
              <Text style={styles.title}>{displayTrack.title}</Text>
              <Pressable 
                style={styles.artistRow}
                onPress={() => {
                  // Could navigate to artist profile in the future
                }}
              >
                {displayTrack.profiles?.avatar_url && (
                  <Image 
                    source={{ uri: displayTrack.profiles.avatar_url }} 
                    style={styles.artistAvatar}
                  />
                )}
                <Text style={styles.artist}>
                  @{displayTrack.profiles?.username || displayTrack.artist_name || 'unknown'}
                </Text>
              </Pressable>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="heart" size={14} color={theme.colors.gray.dark} />
                  <Text style={styles.statText}>{likeCount}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="chatbubble" size={14} color={theme.colors.gray.dark} />
                  <Text style={styles.statText}>{comments.length}</Text>
                </View>
                {displayTrack.genre && (
                  <View style={styles.genreBadge}>
                    <Text style={styles.genreText}>{displayTrack.genre}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.controlsContainer}>
              <View style={styles.progressContainer}>
                <Pressable 
                  style={styles.progressBar}
                  onPress={(e) => {
                    // Calculate seek position from press
                    const { locationX } = e.nativeEvent;
                    const barWidth = e.target?.clientWidth || 300;
                    const seekPercent = locationX / barWidth;
                    const seekTime = seekPercent * (audioDuration || displayTrack.duration || 0);
                    seekTo(seekTime);
                  }}
                >
                  <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
                </Pressable>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                  <Text style={styles.timeText}>
                    {formatTime(audioDuration || displayTrack.duration || 0)}
                  </Text>
                </View>
              </View>

              <PlaybackControls
                isPlaying={isPlaying}
                isLoading={audioLoading}
                onPlayPause={handlePlayPause}
                onNext={() => {}}
                onPrev={() => {}}
                disabled={!displayTrack.audio_url}
              />
              
              {!displayTrack.audio_url && (
                <Text style={styles.noAudioText}>No audio available for this track</Text>
              )}
            </View>
          </View>
        ) : (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.commentsContainer}
          >
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            </View>
            
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={48} color={theme.colors.gray.medium} />
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                </View>
              }
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={theme.colors.gray.medium}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <Pressable 
                style={[
                  styles.sendButton, 
                  (!newComment.trim() || submittingComment) && styles.sendButtonDisabled
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Ionicons name="send" size={18} color={theme.colors.white} />
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 24,
    justifyContent: 'space-evenly',
  },
  artworkContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    maxHeight: '45%',
    marginBottom: 16,
  },
  artwork: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: theme.colors.gray.light,
    maxWidth: 300,
  },
  trackInfo: {
    alignItems: 'center',
    marginVertical: 24,
  },
  controlsContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  artistAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.gray.light,
  },
  artist: {
    fontSize: 16,
    color: theme.colors.gray.dark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: theme.colors.gray.dark,
  },
  genreBadge: {
    backgroundColor: theme.colors.gray.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 12,
    color: theme.colors.gray.dark,
    fontWeight: theme.typography.weights.medium,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.gray.light,
    marginBottom: 12,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.black,
    borderRadius: 2,
  },
  noAudioText: {
    textAlign: 'center',
    color: theme.colors.gray.dark,
    fontSize: 13,
    marginTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 13,
    color: theme.colors.gray.dark,
  },
  actionButton: {
    padding: 8,
  },
  // Comments styles
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  commentsHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.light,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  commentsList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray.light,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  commentTime: {
    fontSize: 12,
    color: theme.colors.gray.dark,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.black,
    lineHeight: 20,
  },
  emptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: theme.colors.gray.dark,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray.light,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.black,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray.medium,
  },
});
