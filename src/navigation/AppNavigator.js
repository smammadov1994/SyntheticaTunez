import { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../utils/supabase';
import { theme } from '../theme';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { CreateGenreScreen } from '../screens/CreateGenreScreen';
import { CreateLyricsScreen } from '../screens/CreateLyricsScreen';
import { CreateVideoScreen } from '../screens/CreateVideoScreen';
import { CreateVocalScreen } from '../screens/CreateVocalScreen';
import { GenerationLoadingScreen } from '../screens/GenerationLoadingScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { NowPlayingScreen } from '../screens/NowPlayingScreen';

const Stack = createNativeStackNavigator();

const CreateFlow = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateLyrics" component={CreateLyricsScreen} />
      <Stack.Screen name="CreateGenre" component={CreateGenreScreen} />
      <Stack.Screen name="CreateVocal" component={CreateVocalScreen} />
      <Stack.Screen name="CreateVideo" component={CreateVideoScreen} />
      <Stack.Screen name="GenerationLoading" component={GenerationLoadingScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
        // User is signed in
        <>
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen name="CreateFlow" component={CreateFlow} options={{ presentation: 'modal' }} />
          <Stack.Screen name="NowPlaying" component={NowPlayingScreen} options={{ presentation: 'modal' }} />
        </>
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
