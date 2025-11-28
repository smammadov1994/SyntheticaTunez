import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export const PlaybackControls = ({ isPlaying, onPlayPause, onNext, onPrev }) => {
  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={onPrev}>
        <Ionicons name="play-skip-back" size={32} color={theme.colors.black} />
      </Pressable>
      
      <Pressable style={styles.playButton} onPress={onPlayPause}>
        <Ionicons 
          name={isPlaying ? 'pause' : 'play'} 
          size={32} 
          color={theme.colors.white} 
        />
      </Pressable>
      
      <Pressable style={styles.button} onPress={onNext}>
        <Ionicons name="play-skip-forward" size={32} color={theme.colors.black} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
});
