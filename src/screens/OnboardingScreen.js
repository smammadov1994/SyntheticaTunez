import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkUsernameAvailability, completeOnboarding } from '../services/database';
import { theme } from '../theme';
import { supabase } from '../utils/supabase';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Zack',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Molly',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Bear',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Rabbit',
];

export const OnboardingScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
  const [error, setError] = useState(null);

  // Debounce username check
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      const isAvailable = await checkUsernameAvailability(username);
      setUsernameAvailable(isAvailable);
      setCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCustomAvatar(result.assets[0].uri);
        setSelectedAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const formData = new FormData();

      // Convert local file URI to a Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      formData.append('file', blob, fileName); // Append blob directly

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { // Use blob directly for upload
          upsert: true,
          contentType: `image/${ext}`, // Specify content type
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
    }
  };

  const handleSubmit = async () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalAvatarUrl = selectedAvatar;

      // If a custom avatar is selected and it's a local file URI, upload it
      if (selectedAvatar === customAvatar && customAvatar && !customAvatar.startsWith('http')) {
        try {
          finalAvatarUrl = await uploadImage(customAvatar);
        } catch (uploadError) {
          console.error("Failed to upload custom avatar, proceeding with local URI:", uploadError);
          // Optionally, set an error message or fallback behavior
          setError('Failed to upload avatar. Please try again or choose a preset.');
          setLoading(false);
          return;
        }
      }

      const success = await completeOnboarding(username, bio, finalAvatarUrl);
      if (success) {
        // Navigation will be handled by AppNavigator listening to auth state/profile
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>Let's set up your profile</Text>
          </View>

          <View style={styles.form}>
            {/* Avatar Selection */}
            <Text style={styles.label}>Choose an Avatar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
              {/* Upload Option */}
              <Pressable
                onPress={pickImage}
                style={[
                  styles.avatarOption,
                  styles.uploadOption,
                  selectedAvatar === customAvatar && styles.avatarSelected
                ]}
              >
                {customAvatar ? (
                  <Image source={{ uri: customAvatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="add" size={32} color={theme.colors.white} />
                  </View>
                )}
                {selectedAvatar === customAvatar && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  </View>
                )}
              </Pressable>

              {AVATAR_PRESETS.map((url, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    setSelectedAvatar(url);
                    setCustomAvatar(null); // Deselect custom avatar if a preset is chosen
                  }}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === url && styles.avatarSelected
                  ]}
                >
                  <Image source={{ uri: url }} style={styles.avatarImage} />
                  {selectedAvatar === url && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="@username"
                  placeholderTextColor={theme.colors.gray.medium}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setError(null);
                  }}
                  autoCapitalize="none"
                  maxLength={20}
                />
                <View style={styles.statusIcon}>
                  {checkingUsername ? (
                    <ActivityIndicator size="small" color={theme.colors.gray.dark} />
                  ) : username.length >= 3 ? (
                    <Ionicons 
                      name={usernameAvailable ? "checkmark-circle" : "close-circle"} 
                      size={24} 
                      color={usernameAvailable ? theme.colors.success : theme.colors.error} 
                    />
                  ) : null}
                </View>
              </View>
              {username.length > 0 && username.length < 3 && (
                <Text style={styles.helperText}>Must be at least 3 characters</Text>
              )}
              {usernameAvailable === false && !checkingUsername && (
                <Text style={[styles.helperText, { color: theme.colors.error }]}>Username is taken</Text>
              )}
            </View>

            {/* Bio Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.colors.gray.medium}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={160}
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={[
                styles.button,
                (loading || !username || username.length < 3 || usernameAvailable === false) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || !username || username.length < 3 || usernameAvailable === false}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>Get Started</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.gray.dark,
  },
  form: {
    gap: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 12,
  },
  avatarList: {
    marginBottom: 8,
  },
  avatarOption: {
    marginRight: 16,
    padding: 4,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  uploadOption: {
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    width: 78,
    height: 78,
  },
  uploadPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.gray.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSelected: {
    borderColor: theme.colors.black,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.gray.light,
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },
  inputGroup: {
    gap: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.gray.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.black,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.gray.dark,
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    height: 56,
    backgroundColor: theme.colors.black,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
});
