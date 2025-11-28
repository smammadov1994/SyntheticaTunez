import { Image, Pressable, StyleSheet, Text, View, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useRef } from 'react';

export const HorizontalFeedCard = ({ item, onPress }) => {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const handlePressIn = () => {
    RNAnimated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    RNAnimated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable 
      style={styles.container} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <RNAnimated.View style={[styles.imageContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={16} color={theme.colors.white} />
        </View>
      </RNAnimated.View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.genre || 'Pop'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  albumArt: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: theme.colors.gray.light,
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
  title: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.gray.dark,
    marginTop: 2,
  },
});

