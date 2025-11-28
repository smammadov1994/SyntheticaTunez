import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { PillButton } from '../components/PillButton';
import { ProgressDots } from '../components/ProgressDots';
import { theme } from '../theme';

const VIDEO_STYLES = [
  "Abstract", "Cinematic", "Animated", "Realistic", "Psychedelic",
  "Retro", "Minimalist", "Futuristic", "Nature", "Urban"
];

export const CreateVideoScreen = ({ navigation, route }) => {
  const { 
    lyrics = '', 
    genre = 'Pop', 
    vocalStyles = [], 
    vocalDetails = '' 
  } = route.params || {};
  
  const [createVideo, setCreateVideo] = useState(null); // true, false, or null
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [videoDescription, setVideoDescription] = useState('');

  const handleGenerate = () => {
    // Build the generation params
    const generationParams = {
      lyrics,
      genre,
      vocalStyles,
      vocalDetails,
      createVideo,
      videoStyle: selectedStyle,
      videoDescription,
    };

    navigation.navigate('GenerationLoading', generationParams);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.black} />
        </Pressable>
        <ProgressDots totalSteps={4} currentStep={4} />
      </View>

      <ScrollView style={styles.mainContent}>
        <Text style={styles.title}>Add a Music Video?</Text>
        <Text style={styles.subtitle}>AI-generated visuals for your track</Text>

        <View style={styles.cardsContainer}>
          <Pressable
            style={[styles.card, createVideo === true && styles.cardSelected]}
            onPress={() => setCreateVideo(true)}
          >
            <Ionicons name="play-circle-outline" size={40} color={createVideo === true ? theme.colors.black : theme.colors.gray.dark} />
            <Text style={[styles.cardText, createVideo === true && styles.cardTextSelected]}>Yes, Create Video</Text>
          </Pressable>

          <Pressable
            style={[styles.card, createVideo === false && styles.cardSelected]}
            onPress={() => setCreateVideo(false)}
          >
            <Ionicons name="close-circle-outline" size={40} color={createVideo === false ? theme.colors.black : theme.colors.gray.dark} />
            <Text style={[styles.cardText, createVideo === false && styles.cardTextSelected]}>Skip for Now</Text>
          </Pressable>
        </View>

        {createVideo === true && (
          <View style={styles.stylesSection}>
            <Text style={styles.sectionTitle}>Video Style</Text>
            <View style={styles.pillsContainer}>
              {VIDEO_STYLES.map((style) => (
                <PillButton
                  key={style}
                  label={style}
                  selected={selectedStyle === style}
                  onPress={() => setSelectedStyle(style)}
                />
              ))}
            </View>
            
            <TextInput
              style={styles.input}
              multiline
              placeholder="Describe the visual style... (e.g., 'neon lights, city at night')"
              placeholderTextColor={theme.colors.gray.medium}
              value={videoDescription}
              onChangeText={setVideoDescription}
              textAlignVertical="top"
              selectionColor={theme.colors.black}
            />
          </View>
        )}

        {/* Summary of selections */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Your Track</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Genre:</Text>
            <Text style={styles.summaryValue}>{genre}</Text>
          </View>
          {lyrics && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lyrics:</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {lyrics.substring(0, 50)}...
              </Text>
            </View>
          )}
          {vocalStyles.length > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Vocals:</Text>
              <Text style={styles.summaryValue}>{vocalStyles.join(', ')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, createVideo === null && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={createVideo === null}
        >
          <Text style={[styles.buttonText, createVideo === null && styles.buttonTextDisabled]}>
            Generate Track
          </Text>
        </Pressable>
        <Text style={styles.estimateText}>~2-3 minutes • Uses 1 credit</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 32,
    zIndex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.gray.dark,
    marginBottom: 32,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    height: 140,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  cardText: {
    fontSize: 15,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.gray.dark,
  },
  cardTextSelected: {
    color: theme.colors.black,
  },
  stylesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: theme.typography.weights.medium,
    marginBottom: 16,
    color: theme.colors.black,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    color: theme.colors.black,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  summarySection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.gray.light,
    borderRadius: theme.borderRadius.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.gray.dark,
    width: 70,
  },
  summaryValue: {
    fontSize: 14,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.medium,
    flex: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray.light,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray.light,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.medium,
  },
  buttonTextDisabled: {
    color: theme.colors.gray.dark,
  },
  estimateText: {
    fontSize: 12,
    color: theme.colors.gray.dark,
  },
});
