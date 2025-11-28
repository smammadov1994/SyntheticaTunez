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

export const CreateLyricsScreen = ({ navigation }) => {
  const [lyrics, setLyrics] = useState('');

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
          <Pressable style={styles.skipButton} onPress={() => navigation.navigate('CreateGenre')}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Add Your Lyrics</Text>
          <Text style={styles.subtitle}>Paste or type the lyrics for your song</Text>

          <TextInput
            style={styles.input}
            multiline
            placeholder={"Verse 1:\nIn the shadows of the night..."}
            placeholderTextColor={theme.colors.gray.medium}
            value={lyrics}
            onChangeText={setLyrics}
            textAlignVertical="top"
            selectionColor={theme.colors.black}
          />

          <Text style={styles.helperText}>
            Or leave blank for AI-generated lyrics
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, !lyrics && styles.buttonDisabled]}
            onPress={() => navigation.navigate('CreateGenre')}
          >
            <Text style={[styles.buttonText, !lyrics && styles.buttonTextDisabled]}>
              Next
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
  helperText: {
    fontSize: 13,
    color: theme.colors.gray.dark,
    textAlign: 'center',
    marginTop: 12,
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
    color: theme.colors.gray.dark,
  },
});
