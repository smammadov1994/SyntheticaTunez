import { ResizeMode, Video } from 'expo-av';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { theme } from '../theme';

export const LandingScreen = ({ navigation }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/videos/landingvideo.mp4')}
        style={styles.video}
        resizeMode="contain"
        shouldPlay
        isLooping
        isMuted
        useNativeControls={false}
      />
      
      <View style={styles.overlay}>
        <Animated.View style={animatedButtonStyle}>
          <Pressable 
              style={styles.button}
              onPress={() => navigation.replace('Auth')}
          >
              <Text style={styles.buttonText}>Enter</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  video: {
    width: '160%',
    height: '100%',
    position: 'absolute',
    top: 40,
    left: '-28%', // Adjusted slightly right from -30%
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end', // Align to right
    paddingBottom: 40,
    paddingRight: 32, // Padding from right edge
  },
  button: {
    backgroundColor: theme.colors.black, // Fully black
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

