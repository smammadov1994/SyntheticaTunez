import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

export const PillButton = ({ label, selected, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        selected ? styles.selectedContainer : styles.unselectedContainer,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.selectedLabel : styles.unselectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    marginRight: 12,
    marginBottom: 12,
  },
  unselectedContainer: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  selectedContainer: {
    backgroundColor: theme.colors.black,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  unselectedLabel: {
    color: theme.colors.black,
  },
  selectedLabel: {
    color: theme.colors.white,
  },
});
