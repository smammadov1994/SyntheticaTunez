import { Montserrat_900Black, useFonts } from '@expo-google-fonts/montserrat';
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { theme } from '../theme';
import { supabase } from '../utils/supabase';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [fontsLoaded] = useFonts({
    Montserrat_900Black,
  });

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const redirectUri = makeRedirectUri({
        scheme: 'syntheticatunez',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        
        if (result.type === 'success' && result.url) {
          // Parse the URL to get the tokens
          // The URL will look like: syntheticatunez://auth/callback#access_token=...&refresh_token=...
          
          // Extract the hash part
          const hashIndex = result.url.indexOf('#');
          if (hashIndex !== -1) {
            const hash = result.url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (sessionError) throw sessionError;
            }
          }
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <View style={styles.mainContainer}>
      <ImageBackground 
        source={require('../../assets/images/loginpageimage.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>SyntheticaTunez</Text>
              <Text style={styles.subtitle}>Synchronize with the melody</Text>
            </View>

            <View style={styles.bottomContainer}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={[styles.googleButton, loading && styles.buttonDisabled]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.black} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color={theme.colors.black} style={styles.googleIcon} />
                    <Text style={styles.buttonText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>
              
              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Reduced opacity since no card
    padding: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 50, // Reduced vertical padding
  },
  header: {
    alignItems: 'center',
    marginTop: 40, // Moved up
  },
  title: {
    fontSize: 34, // Smaller title
    fontFamily: 'Montserrat_900Black',
    color: theme.colors.white,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16, // Smaller subtitle
    color: 'rgba(255, 255, 255, 0.6)', // Fainter/more subtle
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: theme.colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  googleButton: {
    width: '100%',
    height: 64, // Taller button
    backgroundColor: theme.colors.white,
    borderRadius: 32, // Pill shape
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: theme.colors.black,
    fontSize: 18, // Larger text
    fontWeight: theme.typography.weights.bold,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
