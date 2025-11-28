import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { FeedSection } from '../components/FeedSection';
import { SearchBar } from '../components/SearchBar';
import { SideMenu } from '../components/SideMenu';
import { TrackTile } from '../components/TrackTile';
import { getTracksByArtist, getTracksByGenre, getUserTracks } from '../services/database';
import { theme } from '../theme';

export const LibraryScreen = ({ navigation, route }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [feedViewMode, setFeedViewMode] = useState('artists');
  const [artistsFeed, setArtistsFeed] = useState([]);
  const [genresFeed, setGenresFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const searchOpacity = useSharedValue(1);
  const feedOpacity = useSharedValue(0);

  // Fetch user's tracks
  const fetchTracks = useCallback(async () => {
    try {
      const data = await getUserTracks();
      setTracks(data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch community feed data
  const fetchFeedData = useCallback(async () => {
    setFeedLoading(true);
    try {
      const [artists, genres] = await Promise.all([
        getTracksByArtist(),
        getTracksByGenre(),
      ]);
      
      // Transform artists data for FeedSection
      const transformedArtists = artists.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar_url,
        items: user.tracks.map(track => ({
          id: track.id,
          title: track.title,
          albumArt: track.artwork_url || 'https://picsum.photos/400/400',
          genre: track.genre,
        })),
      }));
      
      // Transform genres data for FeedSection
      const transformedGenres = genres.map(genre => ({
        id: genre.id,
        title: genre.title,
        items: genre.items.map(track => ({
          id: track.id,
          title: track.title,
          albumArt: track.artwork_url || 'https://picsum.photos/400/400',
          artist: track.profiles?.username,
        })),
      }));
      
      setArtistsFeed(transformedArtists);
      setGenresFeed(transformedGenres);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    if (showFeed && artistsFeed.length === 0 && genresFeed.length === 0) {
      fetchFeedData();
    }
  }, [showFeed, fetchFeedData]);

  useEffect(() => {
    if (route.params?.newTrack) {
      // Refresh tracks from database to get the full track data
      fetchTracks();
      navigation.setParams({ newTrack: null });
    }
  }, [route.params?.newTrack, fetchTracks]);

  useEffect(() => {
    searchOpacity.value = withTiming(showFeed ? 0 : 1, { duration: 300 });
    feedOpacity.value = withTiming(showFeed ? 1 : 0, { duration: 300 });
  }, [showFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (showFeed) {
      fetchFeedData().then(() => setRefreshing(false));
    } else {
      fetchTracks();
    }
  }, [showFeed, fetchTracks, fetchFeedData]);

  const searchStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ scale: searchOpacity.value }],
    display: showFeed ? 'none' : 'flex',
  }));

  const feedStyle = useAnimatedStyle(() => ({
    opacity: feedOpacity.value,
    transform: [{ scale: feedOpacity.value }],
    display: !showFeed ? 'none' : 'flex',
  }));

  const data = [{ id: 'create-action', isCreateAction: true }, ...tracks];

  const renderLibraryItem = ({ item, index }) => {
    if (item.isCreateAction) {
      return (
        <View style={styles.columnWrapper}>
          <Pressable
            style={styles.createTile}
            onPress={() => navigation.navigate('CreateFlow')}
          >
            <Ionicons name="add" size={40} color={theme.colors.black} />
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.columnWrapper}>
        <TrackTile
          title={item.title}
          artist={item.artist_name || item.profiles?.username || 'Unknown Artist'}
          imageUrl={item.artwork_url || 'https://picsum.photos/400/400'}
          onPress={() => navigation.navigate('NowPlaying', { trackId: item.id })}
        />
      </View>
    );
  };

  const renderEmptyLibrary = () => (
    <Animated.View 
      entering={FadeInDown.delay(200).duration(500)}
      style={styles.emptyContainer}
    >
      <Ionicons name="musical-notes-outline" size={80} color={theme.colors.gray.medium} />
      <Text style={styles.emptyTitle}>Your library is empty</Text>
      <Text style={styles.emptySubtitle}>
        Start by generating your first track!
      </Text>
      <Pressable
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateFlow')}
      >
        <Ionicons name="add" size={20} color={theme.colors.white} />
        <Text style={styles.emptyButtonText}>Create Track</Text>
      </Pressable>
    </Animated.View>
  );

  const renderEmptyFeed = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color={theme.colors.gray.medium} />
      <Text style={styles.emptyTitle}>No community tracks yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share your music!
      </Text>
    </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text 
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {showFeed ? 'Community' : 'Library'}
            </Text>
            
            <Animated.View style={[feedStyle, styles.headerToggle]}>
               <View style={styles.toggleContainer}>
                <Pressable 
                  style={[styles.toggleButton, feedViewMode === 'artists' && styles.toggleButtonActive]}
                  onPress={() => setFeedViewMode('artists')}
                >
                  <Text style={[styles.toggleText, feedViewMode === 'artists' && styles.toggleTextActive]}>Artists</Text>
                </Pressable>
                <Pressable 
                  style={[styles.toggleButton, feedViewMode === 'genres' && styles.toggleButtonActive]}
                  onPress={() => setFeedViewMode('genres')}
                >
                  <Text style={[styles.toggleText, feedViewMode === 'genres' && styles.toggleTextActive]}>Genres</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>

          <View style={styles.headerIcons}>
            <Pressable onPress={() => setShowFeed(!showFeed)} style={styles.iconButton}>
              <Ionicons 
                name={showFeed ? "close" : "grid-outline"} 
                size={24} 
                color={theme.colors.black} 
              />
            </Pressable>
            <Pressable onPress={() => setIsMenuVisible(true)} style={styles.iconButton}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.black} />
            </Pressable>
          </View>
        </View>

        <Animated.View style={searchStyle}>
          <SearchBar />
        </Animated.View>
      </View>

      {!showFeed ? (
        tracks.length === 0 ? (
          renderEmptyLibrary()
        ) : (
          <FlatList
            key="grid-view"
            data={data}
            renderItem={renderLibraryItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )
      ) : feedLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.black} />
        </View>
      ) : (feedViewMode === 'artists' ? artistsFeed : genresFeed).length === 0 ? (
        renderEmptyFeed()
      ) : (
        <FlatList
          key="feed-view"
          data={feedViewMode === 'artists' ? artistsFeed : genresFeed}
          renderItem={({ item }) => (
            <FeedSection
              title={feedViewMode === 'artists' ? item.username : item.title}
              avatar={feedViewMode === 'artists' ? item.avatar : null}
              data={item.items}
              type={feedViewMode === 'artists' ? 'user' : 'genre'}
              onItemPress={(track) => navigation.navigate('NowPlaying', { trackId: track.id })}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <SideMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
        navigation={navigation}
      />
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
  createTile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 10,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 20,
    backgroundColor: theme.colors.white,
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    flexShrink: 1,
  },
  headerToggle: {
    flexShrink: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray.light,
    borderRadius: 16,
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.gray.dark,
  },
  toggleTextActive: {
    color: theme.colors.black,
    fontWeight: theme.typography.weights.bold,
  },
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  columnWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  feedContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.gray.dark,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.black,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
});
