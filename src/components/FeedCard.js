import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export const FeedCard = ({ post }) => {
  const {
    user = {},
    track = {},
    likes = 0,
    comments = 0,
  } = post || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: 'https://i.pravatar.cc/150' }} style={styles.avatar} />
          <View style={styles.userText}>
            <Text style={styles.username}>{user.name || 'Anonymous'}</Text>
            <Text style={styles.timestamp}>2h ago</Text>
          </View>
        </View>
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.black} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Image source={{ uri: track.imageUrl }} style={styles.albumArt} />
        <Text style={styles.title}>{track.title || 'Untitled'}</Text>
        <Text style={styles.description} numberOfLines={2}>
          Just created this amazing track! What do you think?
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Pressable style={styles.playButton}>
            <Ionicons name="play" size={16} color={theme.colors.white} />
          </Pressable>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={24} color={theme.colors.black} />
            <Text style={styles.statText}>{likes}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={22} color={theme.colors.black} />
            <Text style={styles.statText}>{comments}</Text>
          </View>
        </View>
        <Pressable>
          <Ionicons name="share-outline" size={24} color={theme.colors.black} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: 12,
    marginVertical: 8,
    ...theme.shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray.light,
  },
  userText: {
    marginLeft: theme.spacing.sm,
  },
  username: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
  },
  timestamp: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray.dark,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray.light,
    marginBottom: 12,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.gray.dark,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.medium,
  },
});
