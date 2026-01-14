import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
} from "@expo-google-fonts/space-grotesk";
import {
  Syne_700Bold,
  Syne_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/syne";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Waveform bar component with more organic movement
const WaveBar = ({ index, totalBars, isReflection }) => {
  const animation = useSharedValue(0);
  const secondaryAnimation = useSharedValue(0);

  // Calculate position-based properties for wave effect
  const centerIndex = totalBars / 2;
  const distanceFromCenter = Math.abs(index - centerIndex);
  const normalizedDistance = distanceFromCenter / centerIndex;

  useEffect(() => {
    // Create wave-like movement with phase offset
    const phaseOffset = index * 120;
    const duration = 1200 + Math.sin(index * 0.3) * 300;

    animation.value = withDelay(
      phaseOffset,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: duration,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
          }),
          withTiming(0, {
            duration: duration,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
          })
        ),
        -1,
        true
      )
    );

    // Secondary subtle animation for more organic feel
    secondaryAnimation.value = withDelay(
      phaseOffset + 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Create varied heights - taller in center, shorter at edges
    const baseHeight = 8 + (1 - normalizedDistance) * 12;
    const maxHeight = 60 + (1 - normalizedDistance) * 80;
    const secondaryBoost = interpolate(
      secondaryAnimation.value,
      [0, 1],
      [0, 20]
    );
    const height = interpolate(
      animation.value,
      [0, 1],
      [baseHeight, maxHeight + secondaryBoost]
    );

    return {
      height,
      opacity: isReflection
        ? interpolate(animation.value, [0, 0.5, 1], [0.05, 0.15, 0.05])
        : interpolate(animation.value, [0, 0.5, 1], [0.4, 1, 0.4]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.waveBar,
        animatedStyle,
        { backgroundColor: isReflection ? "rgba(255,255,255,0.5)" : "#ffffff" },
      ]}
    />
  );
};

// Floating orb particles
const Orb = ({ delay, size, startX, startY }) => {
  const animation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 1500 }));

    animation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 4000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 4000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
    );

    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity:
      opacity.value *
      interpolate(animation.value, [0, 0.5, 1], [0.15, 0.5, 0.15]),
    transform: [
      { translateY: interpolate(animation.value, [0, 1], [0, -40]) },
      { translateX: interpolate(drift.value, [-1, 1], [-15, 15]) },
      { scale: interpolate(animation.value, [0, 0.5, 1], [0.6, 1.3, 0.6]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          left: startX,
          top: startY,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// Animated ring
const Ring = ({ delay, size }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 4000, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration: 0 })
        ),
        -1
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(0, { duration: 3500 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
};

export const LandingScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
  });

  // Entrance animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(40);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(25);
  const waveOpacity = useSharedValue(0);
  const waveScale = useSharedValue(0.9);
  const taglineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.85);
  const buttonPulse = useSharedValue(1);
  const footerOpacity = useSharedValue(0);

  // Generate wave bars
  const totalBars = 40;
  const waveBars = useMemo(
    () => Array.from({ length: totalBars }, (_, i) => i),
    []
  );

  // Generate orbs
  const orbs = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: i * 150,
        size: 2 + Math.random() * 5,
        startX: Math.random() * SCREEN_WIDTH,
        startY: SCREEN_HEIGHT * 0.25 + Math.random() * SCREEN_HEIGHT * 0.5,
      })),
    []
  );

  useEffect(() => {
    // Staggered entrance animation sequence
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 1200 }));
    titleTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 18, stiffness: 90 })
    );

    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    subtitleTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 18, stiffness: 90 })
    );

    waveOpacity.value = withDelay(800, withTiming(1, { duration: 1400 }));
    waveScale.value = withDelay(
      800,
      withSpring(1, { damping: 15, stiffness: 80 })
    );

    taglineOpacity.value = withDelay(1200, withTiming(1, { duration: 1000 }));

    buttonOpacity.value = withDelay(1500, withTiming(1, { duration: 800 }));
    buttonScale.value = withDelay(
      1500,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    footerOpacity.value = withDelay(1800, withTiming(1, { duration: 800 }));

    // Subtle button glow pulse
    buttonPulse.value = withDelay(
      2500,
      withRepeat(
        withSequence(
          withTiming(1.03, {
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
    transform: [{ scale: waveScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value * buttonPulse.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {/* Deep background gradient */}
      <LinearGradient
        colors={["#000000", "#050508", "#000000"]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Radial glow behind waveform */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={["rgba(255,255,255,0.03)", "transparent"]}
          style={styles.glow}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Subtle grid pattern */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 25 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              { top: i * (SCREEN_HEIGHT / 25) },
            ]}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              { left: i * (SCREEN_WIDTH / 12) },
            ]}
          />
        ))}
      </View>

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <Orb key={orb.id} {...orb} />
      ))}

      {/* Animated rings */}
      <View style={styles.ringContainer}>
        <Ring delay={0} size={200} />
        <Ring delay={1500} size={200} />
        <Ring delay={3000} size={200} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header section */}
        <View style={styles.header}>
          <Animated.View style={titleStyle}>
            <Text style={styles.brandMark}>◆</Text>
          </Animated.View>
          <Animated.Text style={[styles.title, titleStyle]}>
            SYNTHETICA
          </Animated.Text>
          <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
            <View style={styles.subtitleLine} />
            <Text style={styles.subtitle}>AI MUSIC SOCIAL</Text>
            <View style={styles.subtitleLine} />
          </Animated.View>
        </View>

        {/* Waveform visualization */}
        <Animated.View style={[styles.waveformContainer, waveStyle]}>
          <View style={styles.waveform}>
            {waveBars.map((index) => (
              <WaveBar key={index} index={index} totalBars={totalBars} />
            ))}
          </View>
          <View style={styles.waveformReflection}>
            {waveBars.map((index) => (
              <WaveBar
                key={`ref-${index}`}
                index={index}
                totalBars={totalBars}
                isReflection
              />
            ))}
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, taglineStyle]}>
          <Text style={styles.tagline}>Create. Share. Discover.</Text>
          <Text style={styles.taglineSecondary}>
            The platform where AI-generated music{"\n"}meets community
          </Text>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.replace("Auth")}
          >
            <Text style={styles.buttonText}>GET STARTED</Text>
            <View style={styles.buttonArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <View style={styles.footerContent}>
            <Text style={styles.footerLabel}>CREATE</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerLabel}>SHARE</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerLabel}>CONNECT</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  glowContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT * 0.3,
    height: SCREEN_HEIGHT * 0.4,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: SCREEN_WIDTH / 2,
  },
  gridOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.015)",
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  orb: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
  ringContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT * 0.35,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 70,
    paddingBottom: 45,
    paddingHorizontal: 28,
  },
  header: {
    alignItems: "center",
  },
  brandMark: {
    fontSize: 20,
    color: "#ffffff",
    marginBottom: 14,
    opacity: 0.9,
  },
  title: {
    fontFamily: "Syne_800ExtraBold",
    fontSize: 44,
    color: "#ffffff",
    letterSpacing: 6,
    textAlign: "center",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 14,
  },
  subtitleLine: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  subtitle: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 5,
  },
  waveformContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 160,
  },
  waveformReflection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 3,
    height: 50,
    transform: [{ scaleY: -0.35 }],
    marginTop: -8,
  },
  waveBar: {
    width: 2.5,
    borderRadius: 2,
  },
  taglineContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  tagline: {
    fontFamily: "Syne_700Bold",
    fontSize: 22,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 10,
  },
  taglineSecondary: {
    fontFamily: "SpaceGrotesk_300Light",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.45)",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingLeft: 36,
    paddingRight: 18,
    borderRadius: 50,
    gap: 18,
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontFamily: "Syne_700Bold",
    fontSize: 14,
    color: "#000000",
    letterSpacing: 3,
  },
  buttonArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 16,
    color: "#ffffff",
  },
  footer: {
    alignItems: "center",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLabel: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.25)",
    letterSpacing: 3,
  },
  footerDot: {
    fontSize: 6,
    color: "rgba(255, 255, 255, 0.2)",
  },
});
