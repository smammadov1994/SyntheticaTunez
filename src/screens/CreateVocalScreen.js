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

import { Ionicons } from '@expo/vector-icons';

const VOCAL_STYLES = [
  "Male", "Female", "Raspy", "Smooth", 
  "Powerful", "Soft", "Energetic", "Melancholic"
];

export const CreateVocalScreen = ({ navigation }) => {
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [details, setDetails] = useState('');

  const toggleStyle = (style) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.black} />
        </Pressable>
        <ProgressDots totalSteps={4} currentStep={3} />
        <Pressable style={styles.skipButton} onPress={() => navigation.navigate('CreateVideo')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.mainContent}>
        <Text style={styles.title}>Define The Voice</Text>
        <Text style={styles.subtitle}>Describe the vocal characteristics</Text>

        <View style={styles.pillsContainer}>
          {VOCAL_STYLES.map((style) => (
            <PillButton
              key={style}
              label={style}
              selected={selectedStyles.includes(style)}
              onPress={() => toggleStyle(style)}
            />
          ))}
        </View>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Add more details about the voice..."
          placeholderTextColor={theme.colors.gray.medium}
          value={details}
          onChangeText={setDetails}
          textAlignVertical="top"
          selectionColor={theme.colors.black}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, (selectedStyles.length === 0 && !details) && styles.buttonDisabled]}
          onPress={() => navigation.navigate('CreateVideo')}
        >
          <Text style={[styles.buttonText, (selectedStyles.length === 0 && !details) && styles.buttonTextDisabled]}>
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
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    color: theme.colors.black,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
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
