import { useState } from 'react';
import {
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

import { Ionicons } from '@expo/vector-icons';

const GENRES = [
  "Hip-Hop", "Pop", "Rock", "Electronic", "R&B", 
  "Jazz", "Country", "Classical", "Lo-fi", "Ambient"
];

export const CreateGenreScreen = ({ navigation }) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [customGenre, setCustomGenre] = useState('');
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.black} />
        </Pressable>
        <ProgressDots totalSteps={4} currentStep={2} />
        <Pressable style={styles.skipButton} onPress={() => navigation.navigate('CreateVocal')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.mainContent}>
        <Text style={styles.title}>Choose Your Genre</Text>
        <Text style={styles.subtitle}>What style should your song be?</Text>

        <View style={styles.pillsContainer}>
          {GENRES.map((genre) => (
            <PillButton
              key={genre}
              label={genre}
              selected={selectedGenre === genre}
              onPress={() => {
                setSelectedGenre(genre);
                setIsCustomInputVisible(false);
              }}
            />
          ))}
        </View>

        {!isCustomInputVisible ? (
          <Pressable onPress={() => setIsCustomInputVisible(true)}>
            <Text style={styles.customLink}>Or describe your own</Text>
          </Pressable>
        ) : (
          <TextInput
            style={styles.customInput}
            placeholder="Describe your genre..."
            placeholderTextColor={theme.colors.gray.medium}
            value={customGenre}
            onChangeText={setCustomGenre}
            autoFocus
            selectionColor={theme.colors.black}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, (!selectedGenre && !customGenre) && styles.buttonDisabled]}
          onPress={() => navigation.navigate('CreateVocal')}
        >
          <Text style={[styles.buttonText, (!selectedGenre && !customGenre) && styles.buttonTextDisabled]}>
            Next
          </Text>
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  customLink: {
    fontSize: 14,
    color: theme.colors.accent,
    textDecorationLine: 'underline',
  },
  customInput: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.black,
    fontSize: 16,
    paddingVertical: 8,
    color: theme.colors.black,
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
