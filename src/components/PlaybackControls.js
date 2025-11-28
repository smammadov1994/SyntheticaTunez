import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export const PlaybackControls = ({ 
  isPlaying, 
  isLoading = false,
  onPlayPause, 
  onNext, 
  onPrev,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Pressable 
        style={[styles.button, disabled && styles.buttonDisabled]} 
        onPress={onPrev}
        disabled={disabled}
      >
        <Ionicons 
          name="play-skip-back" 
          size={32} 
          color={disabled ? theme.colors.gray.medium : theme.colors.black} 
        />
      </Pressable>
      
      <Pressable 
        style={[styles.playButton, disabled && styles.playButtonDisabled]} 
        onPress={onPlayPause}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Ionicons 
            name={isPlaying ? 'pause' : 'play'} 
            size={32} 
            color={theme.colors.white} 
          />
        )}
      </Pressable>
      
      <Pressable 
        style={[styles.button, disabled && styles.buttonDisabled]} 
        onPress={onNext}
        disabled={disabled}
      >
        <Ionicons 
          name="play-skip-forward" 
          size={32} 
          color={disabled ? theme.colors.gray.medium : theme.colors.black} 
        />
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
  buttonDisabled: {
    opacity: 0.5,
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
  playButtonDisabled: {
    backgroundColor: theme.colors.gray.medium,
  },
});
