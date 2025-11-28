import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export const TrackTile = ({ title, artist, imageUrl, onPress, likeCount, commentCount }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={16} color={theme.colors.white} />
        </View>
      </Animated.View>
      <View style={styles.metadata}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        {(likeCount !== undefined || commentCount !== undefined) && (
          <View style={styles.statsRow}>
            {likeCount !== undefined && (
              <View style={styles.stat}>
                <Ionicons name="heart" size={12} color={theme.colors.gray.dark} />
                <Text style={styles.statText}>{likeCount}</Text>
              </View>
            )}
            {commentCount !== undefined && (
              <View style={styles.stat}>
                <Ionicons name="chatbubble" size={12} color={theme.colors.gray.dark} />
                <Text style={styles.statText}>{commentCount}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray.light,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadow,
  },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  metadata: {
    marginTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
  },
  artist: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.gray.dark,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: theme.colors.gray.dark,
  },
});
