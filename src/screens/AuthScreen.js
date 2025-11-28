import { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withDelay, 
  withTiming,
} from 'react-native-reanimated';
import { supabase } from '../utils/supabase';
import { theme } from '../theme';

export const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);

  useEffect(() => {
    formOpacity.value = withDelay(300, withTiming(1, { duration: 1200 }));
    formTranslateY.value = withDelay(300, withTiming(0, { duration: 1200 }));
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.user) {
        // Show success message in UI (works on all platforms including web)
        setSuccessMessage('Check your email! We sent you a confirmation link. Please verify your email to continue.');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      // Don't manually navigate - the auth state listener in AppNavigator
      // will automatically switch to the authenticated screens
      // when the session is detected
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleSignUp();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ImageBackground 
        source={require('../../assets/images/loginpageimage.png')} 
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
            enabled={false}
          >
            <Animated.View style={[styles.card, animatedFormStyle]}>
              {/* Toggle Header */}
              <View style={styles.headerToggle}>
                <Pressable onPress={() => { setIsLogin(true); setError(null); setSuccessMessage(null); }}>
                  <Text style={[styles.headerTitle, isLogin && styles.headerTitleActive]}>Login</Text>
                </Pressable>
                <Text style={styles.headerDivider}>/</Text>
                <Pressable onPress={() => { setIsLogin(false); setError(null); setSuccessMessage(null); }}>
                  <Text style={[styles.headerTitle, !isLogin && styles.headerTitleActive]}>Sign Up</Text>
                </Pressable>
              </View>

              {/* Success Message */}
              {successMessage && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.form}>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'email' && styles.inputFocused,
                  ]}
                  placeholder="Email"
                  placeholderTextColor={theme.colors.gray.medium}
                  value={email}
                  onChangeText={(text) => { setEmail(text); setError(null); }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  selectionColor={theme.colors.black}
                  editable={!loading}
                />
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'password' && styles.inputFocused,
                  ]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.gray.medium}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setError(null); }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  selectionColor={theme.colors.black}
                  editable={!loading}
                />
              </View>

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Continue' : 'Create Account'}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.black,
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  headerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.gray.medium,
  },
  headerTitleActive: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  headerDivider: {
    fontSize: 32,
    fontWeight: theme.typography.weights.thin,
    color: theme.colors.gray.medium,
    marginHorizontal: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 20,
    marginBottom: 40,
  },
  input: {
    height: 56,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.black,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  inputFocused: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.black,
  },
  button: {
    height: 56,
    backgroundColor: theme.colors.black,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
});
