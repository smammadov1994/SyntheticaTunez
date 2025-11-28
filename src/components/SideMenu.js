import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { 
  ActivityIndicator,
  Alert, 
  Dimensions, 
  FlatList,
  Image, 
  Platform, 
  Pressable, 
  ScrollView,
  StyleSheet, 
  Text, 
  View 
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    FadeIn
} from 'react-native-reanimated';
import { supabase } from '../utils/supabase';
import { getCurrentProfile, getFriends, getPendingFriendRequests, acceptFriendRequest, removeFriend } from '../services/database';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width > 768 ? width * 0.35 : width * 0.85;

export const SideMenu = ({ isVisible, onClose, navigation }) => {
  const translateX = useSharedValue(MENU_WIDTH);
  const opacity = useSharedValue(0);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'friends'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, friendsData, requestsData] = await Promise.all([
        getCurrentProfile(),
        getFriends(),
        getPendingFriendRequests(),
      ]);
      setProfile(profileData);
      setFriends(friendsData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchData();
    }
  }, [isVisible]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSigningOut(false);
      onClose();
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      fetchData(); // Refresh data
    }
  };

  const handleDeclineRequest = async (requestId) => {
    // For decline, we can use removeFriend which deletes the friendship record
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      const success = await removeFriend(request.requester.id);
      if (success) {
        fetchData();
      }
    }
  };

  useEffect(() => {
    if (isVisible) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 120, mass: 0.8 });
      opacity.value = withTiming(0.5, { duration: 300 });
    } else {
      translateX.value = withTiming(MENU_WIDTH, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Image
        source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150' }}
        style={styles.friendAvatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username || 'User'}</Text>
        {item.bio && <Text style={styles.friendBio} numberOfLines={1}>{item.bio}</Text>}
      </View>
    </View>
  );

  const renderPendingRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <Image
        source={{ uri: item.requester?.avatar_url || 'https://i.pravatar.cc/150' }}
        style={styles.friendAvatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.requester?.username || 'User'}</Text>
      </View>
      <View style={styles.requestActions}>
        <Pressable 
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={18} color={theme.colors.white} />
        </Pressable>
        <Pressable 
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Ionicons name="close" size={18} color={theme.colors.white} />
        </Pressable>
      </View>
    </View>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/300' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{profile?.username || 'user'}</Text>
        {profile?.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}
        
        {/* Credits Display */}
        <View style={styles.creditsContainer}>
          <Ionicons name="flash" size={20} color={theme.colors.accent} />
          <Text style={styles.creditsText}>{profile?.credits || 0} Credits</Text>
        </View>
        
        <Text style={styles.stats}>
          {friends.length} Friends
        </Text>
      </View>

      <View style={styles.menuItems}>
        <Pressable style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.black} />
          <Text style={styles.menuItemText}>Settings</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Ionicons name="bookmark-outline" size={24} color={theme.colors.black} />
          <Text style={styles.menuItemText}>Saved</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Ionicons name="card-outline" size={24} color={theme.colors.black} />
          <Text style={styles.menuItemText}>Buy Credits</Text>
        </Pressable>
        <Pressable 
          style={[styles.menuItem, signingOut && { opacity: 0.5 }]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
            {signingOut ? 'Signing out...' : 'Log Out'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderFriendsTab = () => (
    <View style={styles.tabContent}>
      {pendingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Friend Requests ({pendingRequests.length})</Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
      
      <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
      {friends.length === 0 ? (
        <View style={styles.emptyFriends}>
          <Ionicons name="people-outline" size={48} color={theme.colors.gray.medium} />
          <Text style={styles.emptyFriendsText}>No friends yet</Text>
          <Text style={styles.emptyFriendsSubtext}>
            Connect with other creators in the community!
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <View 
      style={[
        StyleSheet.absoluteFill, 
        { zIndex: 100 }
      ]}
      pointerEvents={isVisible ? 'box-none' : 'none'}
    >
      <Animated.View 
        style={[
          styles.backdrop, 
          backdropStyle,
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.menu, animatedStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.black} />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <Pressable 
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={activeTab === 'profile' ? theme.colors.black : theme.colors.gray.dark} 
            />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons 
              name="people-outline" 
              size={20} 
              color={activeTab === 'friends' ? theme.colors.black : theme.colors.gray.dark} 
            />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>Friends</Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.black} />
          </View>
        ) : (
          <View style={styles.content}>
            {activeTab === 'profile' ? renderProfileTab() : renderFriendsTab()}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 100,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: theme.colors.white,
    zIndex: 101,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray.light,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.gray.dark,
  },
  tabTextActive: {
    color: theme.colors.black,
    fontWeight: theme.typography.weights.bold,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.light,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.gray.light,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 8,
  },
  bio: {
    fontSize: 13,
    color: theme.colors.gray.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.accent,
  },
  stats: {
    fontSize: 12,
    color: theme.colors.gray.dark,
  },
  menuItems: {
    gap: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 12,
    color: theme.colors.black,
  },
  requestsSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.light,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.light,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.light,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray.light,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 15,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
  },
  friendBio: {
    fontSize: 13,
    color: theme.colors.gray.dark,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFriendsText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    marginTop: 12,
  },
  emptyFriendsSubtext: {
    fontSize: 14,
    color: theme.colors.gray.dark,
    textAlign: 'center',
    marginTop: 4,
  },
});
