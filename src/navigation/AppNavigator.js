import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getCurrentProfile } from '../services/database';
import { theme } from '../theme';
import { supabase } from '../utils/supabase';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { ChooseTrackScreen } from '../screens/ChooseTrackScreen';
import { CreateGenreScreen } from '../screens/CreateGenreScreen';
import { CreateLyricsScreen } from '../screens/CreateLyricsScreen';
import { CreateVideoScreen } from '../screens/CreateVideoScreen';
import { CreateVocalScreen } from '../screens/CreateVocalScreen';
import { GenerationLoadingScreen } from '../screens/GenerationLoadingScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { NowPlayingScreen } from '../screens/NowPlayingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

const CreateFlow = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateLyrics" component={CreateLyricsScreen} />
      <Stack.Screen name="CreateGenre" component={CreateGenreScreen} />
      <Stack.Screen name="CreateVocal" component={CreateVocalScreen} />
      <Stack.Screen name="CreateVideo" component={CreateVideoScreen} />
      <Stack.Screen name="GenerationLoading" component={GenerationLoadingScreen} />
      <Stack.Screen name="ChooseTrack" component={ChooseTrackScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // Check session and profile
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          const profile = await getCurrentProfile();
          setIsOnboarded(!!profile?.is_onboarded);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Re-check profile on auth change (e.g. login)
        const profile = await getCurrentProfile();
        setIsOnboarded(!!profile?.is_onboarded);
      } else {
        setIsOnboarded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.white} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        isOnboarded ? (
          // User is signed in AND onboarded
          <>
            <Stack.Screen name="Library" component={LibraryScreen} />
            <Stack.Screen name="CreateFlow" component={CreateFlow} options={{ presentation: 'modal' }} />
            <Stack.Screen name="NowPlaying" component={NowPlayingScreen} options={{ presentation: 'modal' }} />
          </>
        ) : (
          // User is signed in but NOT onboarded
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )
      ) : (
        // User is not signed in
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.black,
  },
});
