import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { theme } from '../theme';
import { supabase } from '../utils/supabase';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_600SemiBold,
    Montserrat_400Regular,
  });

  // Use an app deep link that Supabase is allowed to redirect to after OAuth completes.
  // In Expo Go this will be an `exp://...` URL; in a native build it will be `syntheticatunez://auth/callback`
  // (scheme is defined in `app.json`).
  const redirectUri = AuthSession.makeRedirectUri({ path: 'auth/callback' });
  // On Android, `openAuthSessionAsync` matches redirects against the `returnUrl`. If there’s any subtle mismatch
  // (e.g. `/--/` path nuances), the session can appear to “hang” in the browser because the redirect is never detected.
  // Using the base return URL makes the matcher more tolerant while we still parse the final URL for `code`.
  const returnUrl = AuthSession.makeRedirectUri();

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Email Auth:', isLogin ? 'Login' : 'Signup', email);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('📧 Login response:', { data, error });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        console.log('📧 Signup response:', { data, error });
        if (error) throw error;
        Alert.alert('Success', 'Please check your email for verification!');
      }
    } catch (err) {
      console.error('❌ Email auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting Google OAuth via Supabase.', { redirectUri, returnUrl });

      // Web uses a different flow (full-page redirect), so keep native handling separate.
      if (Platform.OS === 'web') {
        const { error: webError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // On web, Supabase will redirect the browser; ensure your Site URL / redirect allowlist includes it.
            redirectTo: window.location.origin,
          },
        });
        if (webError) throw webError;
        return;
      }

      // Native/Expo: request the Supabase-hosted OAuth URL (PKCE verifier stored by supabase-js),
      // open an auth session, then exchange the returned `code` for a Supabase session.
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });
      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error('Supabase did not return an OAuth URL.');

      // Safety net: if the custom tab never redirects back into the app, don't spin forever.
      const timeoutMs = 90_000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Google login timed out waiting for redirect back to the app. ' +
                  'This usually means the Supabase Redirect URLs allowlist is missing the exact Expo Go return URL ' +
                  '(or Android did not open the deep link).'
              )
            ),
          timeoutMs
        )
      );

      const res = await Promise.race([
        WebBrowser.openAuthSessionAsync(data.url, returnUrl),
        timeoutPromise,
      ]);

      if (res.type === 'cancel' || res.type === 'dismiss') {
        console.log('❌ User cancelled Google login');
        return;
      }
      if (res.type !== 'success' || !res.url) {
        throw new Error(`OAuth did not complete successfully (type: ${res.type}).`);
      }

      console.log('✅ OAuth redirect received:', res.url);

      // Prefer PKCE code exchange (Supabase flowType: 'pkce').
      const url = res.url;
      const queryIndex = url.indexOf('?');
      const hashIndex = url.indexOf('#');

      const query = queryIndex !== -1
        ? url.substring(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined)
        : '';
      const hash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';

      const queryParams = new URLSearchParams(query);
      const hashParams = new URLSearchParams(hash);

      const oauthCode = queryParams.get('code');
      const oauthErrorParam = queryParams.get('error') || hashParams.get('error');
      const oauthErrorDesc = queryParams.get('error_description') || hashParams.get('error_description');

      if (oauthErrorParam) {
        throw new Error(oauthErrorDesc ? `${oauthErrorParam}: ${oauthErrorDesc}` : oauthErrorParam);
      }

      if (oauthCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(oauthCode);
        if (exchangeError) throw exchangeError;
        console.log('✅ Supabase session established via code exchange');
        return;
      }

      // Fallback: some configurations return tokens directly.
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        console.log('✅ Supabase session established via token setSession fallback');
        return;
      }

      throw new Error('OAuth completed but no code/tokens were returned to the app.');
    } catch (err) {
      console.error('❌ Google auth error:', err);
      setError(err?.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.black} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Enter your details to sign in' 
              : 'Sign up to start creating music'}
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="hello@example.com"
              placeholderTextColor={theme.colors.gray.medium}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.gray.medium}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={theme.colors.black} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={theme.colors.black} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Google</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Pressable onPress={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}>
            <Text style={styles.footerAction}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    color: theme.colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: theme.colors.gray.dark,
  },
  form: {
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.black,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: theme.colors.black,
  },
  primaryButton: {
    height: 56,
    backgroundColor: theme.colors.black,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray.medium,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.colors.gray.dark,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  googleButton: {
    height: 56,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray.medium,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: theme.colors.black,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: theme.colors.gray.dark,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  footerAction: {
    color: theme.colors.black,
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
});
