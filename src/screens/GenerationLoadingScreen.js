import { useEffect, useState } from 'react';
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
import { theme } from '../theme';

export const GenerationLoadingScreen = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Generating audio...");
  
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigation.navigate('Library', {
              newTrack: {
                id: `generated-${Date.now()}`,
                title: 'New Masterpiece',
                artist: 'You',
                imageUrl: 'https://picsum.photos/400/400?random=new',
              }
            });
          }, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress > 30 && progress < 60) setStatusText("Mixing vocals...");
    if (progress >= 60) setStatusText("Rendering video...");
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.circle, animatedStyle]} />
        
        <Text style={styles.title}>Creating Your Masterpiece</Text>
        <Text style={styles.status}>{statusText}</Text>
        <Text style={styles.percentage}>{progress}%</Text>
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
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.black,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    color: theme.colors.gray.dark,
    marginBottom: 24,
  },
  percentage: {
    fontSize: 48,
    fontWeight: theme.typography.weights.thin,
    color: theme.colors.black,
  },
  cancelButton: {
    padding: 20,
    marginBottom: 20,
  },
  cancelText: {
    color: theme.colors.error,
    fontSize: 16,
  },
});
