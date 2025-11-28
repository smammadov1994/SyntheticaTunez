import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../theme';

export const SearchBar = () => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Ionicons name="search" size={20} color={theme.colors.gray.medium} />
      <TextInput
        style={styles.input}
        placeholder="Search your music"
        placeholderTextColor={theme.colors.gray.medium}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={theme.colors.black}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  containerFocused: {
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.black,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
});
