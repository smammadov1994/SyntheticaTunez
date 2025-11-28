import { useEffect, useRef, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { generateCompleteTrack } from '../services/replicate';
import { theme } from '../theme';

const STATUS_MESSAGES = [
  "Analyzing your lyrics...",
  "Composing melodies...",
  "Generating audio with AI...",
  "Creating cover art...",
  "Mixing and mastering...",
  "Adding the finishing touches...",
  "Almost there...",
];

const STATUS_MESSAGES_WITH_VIDEO = [
  "Analyzing your lyrics...",
  "Composing melodies...",
  "Generating audio with AI...",
  "Creating cover art...",
  "Generating music video...",
  "Rendering video frames...",
  "Mixing and mastering...",
  "Adding the finishing touches...",
  "Almost there...",
];

export const GenerationLoadingScreen = ({ navigation, route }) => {
  const {
    lyrics = '',
    genre = 'Pop',
    vocalStyles = [],
    vocalDetails = '',
    createVideo = false,
    videoStyle = '',
    videoDescription = '',
    videoPrompt = '',
  } = route.params || {};

  const messages = createVideo ? STATUS_MESSAGES_WITH_VIDEO : STATUS_MESSAGES;

  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const generationStarted = useRef(false);
  
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  const dotOpacity1 = useSharedValue(0.3);
  const dotOpacity2 = useSharedValue(0.3);
  const dotOpacity3 = useSharedValue(0.3);

  // Build tags/prompt from genre and vocal styles
  const buildTags = () => {
    const parts = [genre];
    if (vocalStyles.length > 0) {
      parts.push(...vocalStyles.map(s => s.toLowerCase()));
    }
    if (vocalDetails) {
      parts.push(vocalDetails);
    }
    return parts.join(', ');
  };

  const buildPrompt = () => {
    const parts = [genre];
    if (vocalStyles.length > 0) {
      parts.push(vocalStyles.join(', '));
    }
    if (vocalDetails) {
      parts.push(vocalDetails);
    }
    return parts.join(', ');
  };

  // Format lyrics with proper structure tags if not present
  const formatLyrics = () => {
    if (!lyrics) {
      // Generate placeholder lyrics structure
      return `[verse]\nAI generated lyrics will appear here\n\n[chorus]\nWith melodies divine`;
    }
    // If lyrics don't have structure tags, add them
    if (!lyrics.includes('[') && !lyrics.includes(']')) {
      return `[verse]\n${lyrics}`;
    }
    return lyrics;
  };

  useEffect(() => {
    // Pulse animation for the main circle
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.ease }),
        withTiming(1, { duration: 800, easing: Easing.ease })
      ),
      -1,
      false
    );

    // Rotation animation for the outer ring
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Animated dots
    const animateDots = () => {
      dotOpacity1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );
      
      setTimeout(() => {
        dotOpacity2.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        );
      }, 200);
      
      setTimeout(() => {
        dotOpacity3.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        );
      }, 400);
    };
    
    animateDots();

    // Status message rotation
    const statusInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % messages.length);
    }, 4000);

    // Elapsed time counter
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    if (generationStarted.current) return;
    generationStarted.current = true;

    const startGeneration = async () => {
      try {
        const tags = buildTags();
        const prompt = buildPrompt();
        const formattedLyrics = formatLyrics();

        console.log('Starting generation with:', { tags, prompt, lyrics: formattedLyrics, genre });

        const result = await generateCompleteTrack({
          title: 'Untitled Track',
          tags,
          prompt,
          lyrics: formattedLyrics,
          genre,
          duration: 60,
          createVideo,
          videoPrompt,
        });

        // Navigate to choice screen with both options
        navigation.replace('ChooseTrack', {
          generationResult: result,
          originalParams: route.params,
        });

      } catch (err) {
        console.error('Generation error:', err);
        setError(err.message || 'Failed to generate track. Please try again.');
      }
    };

    startGeneration();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dotOpacity1.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dotOpacity2.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dotOpacity3.value,
  }));

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.errorCircle}>
            <Text style={styles.errorIcon}>!</Text>
          </View>
          
          <Text style={styles.title}>Generation Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          <Pressable 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setElapsedTime(0);
              generationStarted.current = false;
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.circleContainer}>
          <Animated.View style={[styles.outerRing, animatedRotateStyle]} />
          <Animated.View style={[styles.circle, animatedPulseStyle]}>
            <View style={styles.innerGlow} />
          </Animated.View>
        </View>
        
        <Text style={styles.title}>Creating Your Masterpiece</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.status}>{messages[statusIndex]}</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, dot1Style]} />
            <Animated.View style={[styles.dot, dot2Style]} />
            <Animated.View style={[styles.dot, dot3Style]} />
          </View>
        </View>

        <Text style={styles.timeText}>
          {formatTime(elapsedTime)}
        </Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            🎵 Generating two unique versions for you to choose from
          </Text>
          {createVideo && (
            <Text style={styles.infoText}>
              🎬 Plus a 4-second looping music video
            </Text>
          )}
          <Text style={styles.tipText}>
            This usually takes {createVideo ? '3-5' : '2-3'} minutes
          </Text>
        </View>
      </View>

      <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 40,
  },
  circleContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  innerGlow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.gray.light,
    borderTopColor: theme.colors.black,
    borderRightColor: theme.colors.gray.medium,
  },
  title: {
    fontSize: 26,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 24,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    color: theme.colors.gray.dark,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 4,
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray.dark,
  },
  timeText: {
    fontSize: 48,
    fontWeight: theme.typography.weights.thin,
    color: theme.colors.black,
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  infoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.black,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 13,
    color: theme.colors.gray.dark,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 20,
    marginBottom: 20,
  },
  cancelText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 40,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.gray.dark,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
  },
});
