import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { createTrack } from '../services/database';
import { theme } from '../theme';

export const ChooseTrackScreen = ({ navigation, route }) => {
  const { generationResult, originalParams } = route.params || {};
  
  const [selectedOption, setSelectedOption] = useState(null); // 'option1' or 'option2'
  const [playingOption, setPlayingOption] = useState(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [saving, setSaving] = useState(false);
  
  const soundRef = useRef(null);
  const option1Scale = useSharedValue(1);
  const option2Scale = useSharedValue(1);

  const { musicOptions, coverArtUrl, genre, lyrics, duration } = generationResult || {};

  const handlePlayPause = async (option) => {
    try {
      // Stop current playback
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingOption === option) {
        setPlayingOption(null);
        return;
      }

      const audioUrl = option === 'option1' 
        ? musicOptions?.option1?.url 
        : musicOptions?.option2?.url;

      if (!audioUrl) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setPlayingOption(option);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingOption(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    
    // Animate selection
    if (option === 'option1') {
      option1Scale.value = withSpring(1.02);
      option2Scale.value = withSpring(0.98);
    } else {
      option1Scale.value = withSpring(0.98);
      option2Scale.value = withSpring(1.02);
    }
  };

  const handleSaveTrack = async () => {
    if (!selectedOption || !trackTitle.trim()) return;

    setSaving(true);

    try {
      const selectedMusic = selectedOption === 'option1' 
        ? musicOptions?.option1 
        : musicOptions?.option2;

      const newTrack = await createTrack({
        title: trackTitle.trim(),
        genre,
        lyrics,
        duration,
        artwork_url: coverArtUrl,
        audio_url: selectedMusic?.url,
        is_public: true,
      });

      // Stop any playing audio
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      // Navigate to library with the new track
      navigation.navigate('Library', { newTrack });
    } catch (error) {
      console.error('Error saving track:', error);
      alert('Failed to save track. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const option1Style = useAnimatedStyle(() => ({
    transform: [{ scale: option1Scale.value }],
  }));

  const option2Style = useAnimatedStyle(() => ({
    transform: [{ scale: option2Scale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Your Track</Text>
        <View style={styles.placeholder} />
      </View>

      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        {/* Cover Art Preview */}
        <View style={styles.coverArtContainer}>
          <Image
            source={{ uri: coverArtUrl || 'https://picsum.photos/400/400' }}
            style={styles.coverArt}
          />
        </View>

        {/* Track Title Input */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <TextInput
            style={styles.titleInput}
            placeholder="Name your track..."
            placeholderTextColor={theme.colors.gray.medium}
            value={trackTitle}
            onChangeText={setTrackTitle}
            selectionColor={theme.colors.black}
          />
        </Animated.View>

        {/* Options */}
        <Text style={styles.sectionTitle}>Listen & Choose</Text>
        <Text style={styles.sectionSubtitle}>
          We generated two versions. Pick your favorite!
        </Text>

        <View style={styles.optionsContainer}>
          {/* Option 1 */}
          <Animated.View style={[styles.optionWrapper, option1Style]}>
            <Pressable
              style={[
                styles.optionCard,
                selectedOption === 'option1' && styles.optionCardSelected,
              ]}
              onPress={() => handleSelectOption('option1')}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>A</Text>
                </View>
                <Text style={styles.optionTitle}>
                  {musicOptions?.option1?.description || 'Version A'}
                </Text>
              </View>
              
              <Pressable
                style={styles.playButton}
                onPress={() => handlePlayPause('option1')}
              >
                <Ionicons
                  name={playingOption === 'option1' ? 'pause' : 'play'}
                  size={24}
                  color={theme.colors.white}
                />
              </Pressable>

              {selectedOption === 'option1' && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* Option 2 */}
          <Animated.View style={[styles.optionWrapper, option2Style]}>
            <Pressable
              style={[
                styles.optionCard,
                selectedOption === 'option2' && styles.optionCardSelected,
              ]}
              onPress={() => handleSelectOption('option2')}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.optionBadge, styles.optionBadgeB]}>
                  <Text style={styles.optionBadgeText}>B</Text>
                </View>
                <Text style={styles.optionTitle}>
                  {musicOptions?.option2?.description || 'Version B'}
                </Text>
              </View>
              
              <Pressable
                style={styles.playButton}
                onPress={() => handlePlayPause('option2')}
              >
                <Ionicons
                  name={playingOption === 'option2' ? 'pause' : 'play'}
                  size={24}
                  color={theme.colors.white}
                />
              </Pressable>

              {selectedOption === 'option2' && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.saveButton,
            (!selectedOption || !trackTitle.trim() || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveTrack}
          disabled={!selectedOption || !trackTitle.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save to Library</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  coverArtContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  coverArt: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: theme.colors.gray.light,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: 32,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gray.light,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.gray.dark,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionWrapper: {
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(10, 132, 255, 0.05)',
  },
  optionHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadgeB: {
    backgroundColor: theme.colors.gray.dark,
  },
  optionBadgeText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray.light,
  },
  saveButton: {
    height: 52,
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.gray.light,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
  },
});

