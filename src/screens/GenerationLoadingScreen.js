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
  } = route.params || {};

  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState(null);
  const generationStarted = useRef(false);
  
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);

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
    // Pulse animation
    pulse.value = withRepeat(
      withTiming(1.15, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );

    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Progress simulation (will be replaced by actual progress)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Cap at 95% until generation completes
        return prev + Math.random() * 3;
      });
    }, 500);

    // Status message rotation
    const statusInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
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
          title: 'Untitled Track', // Will be named by user later
          tags,
          prompt,
          lyrics: formattedLyrics,
          genre,
          duration: 60,
        });

        setProgress(100);

        // Navigate to choice screen with both options
        setTimeout(() => {
          navigation.replace('ChooseTrack', {
            generationResult: result,
            originalParams: route.params,
          });
        }, 500);

      } catch (err) {
        console.error('Generation error:', err);
        setError(err.message || 'Failed to generate track. Please try again.');
      }
    };

    startGeneration();
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
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
              setProgress(0);
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
          <Animated.View style={[styles.circle, animatedPulseStyle]} />
        </View>
        
        <Text style={styles.title}>Creating Your Masterpiece</Text>
        <Text style={styles.status}>{STATUS_MESSAGES[statusIndex]}</Text>
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.tipText}>
          💡 Tip: This usually takes 2-3 minutes
        </Text>
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
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.black,
  },
  outerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.gray.light,
    borderTopColor: theme.colors.black,
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: theme.colors.gray.dark,
    marginBottom: 24,
    textAlign: 'center',
  },
  percentage: {
    fontSize: 48,
    fontWeight: theme.typography.weights.thin,
    color: theme.colors.black,
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.black,
    borderRadius: 2,
  },
  tipText: {
    fontSize: 14,
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
