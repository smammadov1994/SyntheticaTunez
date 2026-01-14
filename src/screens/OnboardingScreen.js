import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
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
import { theme } from '../theme';
import { supabase } from '../utils/supabase';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Zack',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Molly',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Bear',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Rabbit',
];

export const OnboardingScreen = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setCustomAvatar(uri);
      setAvatar(uri);
    }
  };

  const uploadCustomAvatar = async (uri) => {
    const { data: { user } } = await supabase.auth.getUser();
    const ext = uri.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleFinish = async () => {
    // Validate
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Upload custom avatar if needed
      let avatarUrl = avatar;
      if (customAvatar && avatar === customAvatar) {
        avatarUrl = await uploadCustomAvatar(customAvatar);
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          bio: bio || null,
          avatar_url: avatarUrl,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Done! Tell AppNavigator we're finished
      onComplete();
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header with dev logout */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>Set up your profile</Text>
            </View>
            <Pressable 
              style={styles.logoutBtn} 
              onPress={() => supabase.auth.signOut()}
            >
              <Ionicons name="log-out-outline" size={20} color="#999" />
            </Pressable>
          </View>

          {/* Avatar Selection */}
          <Text style={styles.label}>Choose Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
            {/* Custom upload */}
            <Pressable onPress={pickImage} style={[styles.avatarBtn, avatar === customAvatar && styles.avatarSelected]}>
              {customAvatar ? (
                <Image source={{ uri: customAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.addAvatar}>
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
              )}
            </Pressable>
            
            {/* Presets */}
            {AVATARS.map((url) => (
              <Pressable 
                key={url} 
                onPress={() => { setAvatar(url); setCustomAvatar(null); }}
                style={[styles.avatarBtn, avatar === url && styles.avatarSelected]}
              >
                <Image source={{ uri: url }} style={styles.avatarImg} />
              </Pressable>
            ))}
          </ScrollView>

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="@username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            maxLength={20}
          />

          {/* Bio */}
          <Text style={styles.label}>Bio (Optional)</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#999"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={160}
          />

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Finish Up</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 20,
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatarBtn: {
    marginRight: 12,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#000',
  },
  avatarImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eee',
  },
  addAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorBox: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
