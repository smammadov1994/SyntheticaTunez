import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export const ProgressDots = ({ totalSteps = 4, currentStep }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index + 1 <= currentStep ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.black,
  },
  inactiveDot: {
    borderWidth: 1,
    borderColor: theme.colors.gray.medium,
    backgroundColor: 'transparent',
  },
});
