import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { ProgressDots } from '../components/ProgressDots';
import { theme } from '../theme';

import { Ionicons } from '@expo/vector-icons';

const MIN_CHARS = 100;
const MAX_CHARS = 600;

export const CreateLyricsScreen = ({ navigation }) => {
  const [lyrics, setLyrics] = useState('');

  const charCount = lyrics.length;
  const isTooShort = lyrics.length > 0 && lyrics.length < MIN_CHARS;
  const isTooLong = lyrics.length > MAX_CHARS;
  const isValid = lyrics.length === 0 || (lyrics.length >= MIN_CHARS && lyrics.length <= MAX_CHARS);

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('CreateGenre', { lyrics });
  };

  const handleSkip = () => {
    navigation.navigate('CreateGenre', { lyrics: '' });
  };

  const getCharCountColor = () => {
    if (isTooLong) return theme.colors.error;
    if (isTooShort) return theme.colors.warning || '#F5A623';
    if (charCount >= MIN_CHARS) return theme.colors.success || '#34C759';
    return theme.colors.gray.dark;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.colors.black} />
          </Pressable>
          <ProgressDots totalSteps={4} currentStep={1} />
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Add Your Lyrics</Text>
          <Text style={styles.subtitle}>
            Use tags like [verse], [chorus], [bridge] to structure your song
          </Text>

          <TextInput
            style={[
              styles.input,
              isTooLong && styles.inputError,
            ]}
            multiline
            placeholder={"[verse]\nIn the shadows of the night...\n\n[chorus]\nWe rise above the light..."}
            placeholderTextColor={theme.colors.gray.medium}
            value={lyrics}
            onChangeText={setLyrics}
            textAlignVertical="top"
            selectionColor={theme.colors.black}
          />

          <View style={styles.charCountContainer}>
            <Text style={[styles.charCount, { color: getCharCountColor() }]}>
              {charCount}/{MAX_CHARS}
            </Text>
            {isTooShort && (
              <Text style={styles.charWarning}>
                Minimum {MIN_CHARS} characters required
              </Text>
            )}
            {isTooLong && (
              <Text style={styles.charError}>
                Maximum {MAX_CHARS} characters exceeded
              </Text>
            )}
          </View>

          <Text style={styles.helperText}>
            {lyrics.length === 0 
              ? 'Or leave blank for AI-generated lyrics' 
              : `${MIN_CHARS}-${MAX_CHARS} characters required`}
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.button,
              !isValid && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isValid}
          >
            <Text style={[
              styles.buttonText,
              !isValid && styles.buttonTextDisabled,
            ]}>
              {lyrics ? 'Next' : 'Skip to Genre'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
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
  skipButton: {
    position: 'absolute',
    right: 20,
    top: 32,
  },
  skipText: {
    color: theme.colors.gray.dark,
    fontSize: 15,
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
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 200,
    color: theme.colors.black,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
  },
  charWarning: {
    fontSize: 12,
    color: '#F5A623',
  },
  charError: {
    fontSize: 12,
    color: theme.colors.error,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.gray.dark,
    textAlign: 'center',
    marginTop: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray.light,
  },
  button: {
    height: 52,
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: theme.colors.gray.medium,
  },
});
