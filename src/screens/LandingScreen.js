import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from "@expo-google-fonts/space-grotesk";
import {
  Syne_700Bold,
  Syne_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/syne";
import { LinearGradient } from "expo-linear-gradient";
import { createContext, useContext, useEffect, useMemo } from "react";
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

// Context for scan line position
const ScanLineContext = createContext(null);

// Hook to get glitch effect based on scan line proximity
const useGlitchEffect = (elementY, elementHeight = 50) => {
  const scanLineY = useContext(ScanLineContext);

  const glitchStyle = useAnimatedStyle(() => {
    if (!scanLineY) return {};

    const linePos = scanLineY.value;
    const elementTop = elementY;
    const elementBottom = elementY + elementHeight;

    // Check if scan line is within or near the element
    const isNear = linePos > elementTop - 30 && linePos < elementBottom + 30;
    const isInside = linePos > elementTop && linePos < elementBottom;

    // Calculate distance from center of element
    const elementCenter = elementTop + elementHeight / 2;
    const distanceFromCenter = Math.abs(linePos - elementCenter);
    const maxDistance = elementHeight / 2 + 30;
    const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);

    // Glitch intensity (strongest when line is at center of element)
    const intensity = isNear ? 1 - normalizedDistance : 0;

    // Random-ish displacement based on line position
    const randomOffset =
      Math.sin(linePos * 0.5) * 15 + Math.cos(linePos * 0.3) * 10;

    return {
      transform: [
        { translateX: intensity * randomOffset },
        { skewX: `${intensity * 3}deg` },
      ],
      opacity: isInside ? interpolate(intensity, [0, 0.5, 1], [1, 0.7, 1]) : 1,
    };
  });

  return glitchStyle;
};

// Static noise overlay component
const StaticNoise = ({ elementY, elementHeight }) => {
  const scanLineY = useContext(ScanLineContext);

  const noiseStyle = useAnimatedStyle(() => {
    if (!scanLineY) return { opacity: 0 };

    const linePos = scanLineY.value;
    const elementTop = elementY;
    const elementBottom = elementY + elementHeight;

    const isNear = linePos > elementTop - 20 && linePos < elementBottom + 20;
    const elementCenter = elementTop + elementHeight / 2;
    const distanceFromCenter = Math.abs(linePos - elementCenter);
    const maxDistance = elementHeight / 2 + 20;
    const intensity = isNear
      ? Math.max(0, 1 - distanceFromCenter / maxDistance)
      : 0;

    return {
      opacity: intensity * 0.6,
    };
  });

  return (
    <Animated.View
      style={[styles.staticNoise, noiseStyle]}
      pointerEvents="none"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.noiseLine,
            {
              top: `${i * 12.5}%`,
              width: `${50 + Math.random() * 50}%`,
              left: `${Math.random() * 25}%`,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
};

// Glitchable text component
const GlitchText = ({ children, style, elementY, elementHeight = 40 }) => {
  const glitchStyle = useGlitchEffect(elementY, elementHeight);

  return (
    <View>
      <Animated.Text style={[style, glitchStyle]}>{children}</Animated.Text>
      <StaticNoise elementY={elementY} elementHeight={elementHeight} />
    </View>
  );
};

// Glitchable view component
const GlitchView = ({ children, style, elementY, elementHeight = 50 }) => {
  const glitchStyle = useGlitchEffect(elementY, elementHeight);

  return (
    <Animated.View style={[style, glitchStyle]}>
      {children}
      <StaticNoise elementY={elementY} elementHeight={elementHeight} />
    </Animated.View>
  );
};

// Orbital dot component
const OrbitalDot = ({ angle, radius, speed, size, delay }) => {
  const rotation = useSharedValue(angle);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));

    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(angle + 360, {
          duration: speed,
          easing: Easing.linear,
        }),
        -1
      )
    );

    pulse.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(1.4, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const rad = (rotation.value * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    return {
      opacity:
        opacity.value *
        interpolate(Math.sin(rotation.value * 0.02), [-1, 1], [0.4, 1]),
      transform: [{ translateX: x }, { translateY: y }, { scale: pulse.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.orbitalDot,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
};

// Rotating ring with glitch
const RotatingRing = ({
  size,
  strokeWidth,
  speed,
  direction,
  delay,
  elementY,
}) => {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glitchStyle = useGlitchEffect(elementY, size);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 1200 }));

    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(direction * 360, {
          duration: speed,
          easing: Easing.linear,
        }),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.rotatingRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
        },
        animatedStyle,
        glitchStyle,
      ]}
    >
      <View style={[styles.ringAccent, { top: -strokeWidth }]} />
      <View style={[styles.ringAccent, { bottom: -strokeWidth }]} />
      <View
        style={[
          styles.ringAccent,
          { left: -strokeWidth, top: "50%", marginTop: -2 },
        ]}
      />
      <View
        style={[
          styles.ringAccent,
          { right: -strokeWidth, top: "50%", marginTop: -2 },
        ]}
      />
    </Animated.View>
  );
};

// Animated letter component for title with glitch
const AnimatedLetter = ({ letter, index, totalLetters, baseY }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(60);
  const scale = useSharedValue(0.7);
  const glitchStyle = useGlitchEffect(baseY, 50);

  useEffect(() => {
    const delay = 400 + index * 80;

    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 90 })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.titleLetter, animatedStyle, glitchStyle]}>
      {letter}
    </Animated.Text>
  );
};

// Scanning line effect
const ScanLine = ({ scanLineY }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(1500, withTiming(1, { duration: 500 }));

    scanLineY.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(SCREEN_HEIGHT + 50, {
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-50, { duration: 0 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: scanLineY.value }],
  }));

  return (
    <Animated.View style={[styles.scanLineContainer, animatedStyle]}>
      {/* Main bright line */}
      <View style={styles.scanLineMain} />
      {/* Glow effect */}
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.15)", "transparent"]}
        style={styles.scanLineGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </Animated.View>
  );
};

export const LandingScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
  });

  // Shared scan line position
  const scanLineY = useSharedValue(-50);

  const titleLetters = "SYNTHETICA".split("");

  // Animation values
  const heroOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);
  const tagTranslateX = useSharedValue(-30);
  const descOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const orbitalOpacity = useSharedValue(0);
  const orbitalScale = useSharedValue(0.8);
  const cornerOpacity = useSharedValue(0);

  // Element Y positions (approximate, adjust based on your layout)
  const tagY = 90;
  const orbitalY = SCREEN_HEIGHT * 0.28;
  const titleY = SCREEN_HEIGHT * 0.52;
  const subtitleY = SCREEN_HEIGHT * 0.62;
  const featuresY = SCREEN_HEIGHT * 0.75;
  const buttonY = SCREEN_HEIGHT * 0.83;

  // Orbital configuration
  const orbitals = useMemo(
    () => [
      { angle: 0, radius: 90, speed: 12000, size: 6, delay: 800 },
      { angle: 72, radius: 90, speed: 12000, size: 4, delay: 900 },
      { angle: 144, radius: 90, speed: 12000, size: 5, delay: 1000 },
      { angle: 216, radius: 90, speed: 12000, size: 4, delay: 1100 },
      { angle: 288, radius: 90, speed: 12000, size: 6, delay: 1200 },
      { angle: 30, radius: 120, speed: 18000, size: 3, delay: 1300 },
      { angle: 120, radius: 120, speed: 18000, size: 4, delay: 1400 },
      { angle: 210, radius: 120, speed: 18000, size: 3, delay: 1500 },
      { angle: 300, radius: 120, speed: 18000, size: 4, delay: 1600 },
    ],
    []
  );

  useEffect(() => {
    heroOpacity.value = withDelay(200, withTiming(1, { duration: 1000 }));

    tagOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    tagTranslateX.value = withDelay(1200, withSpring(0, { damping: 20 }));

    orbitalOpacity.value = withDelay(600, withTiming(1, { duration: 1200 }));
    orbitalScale.value = withDelay(600, withSpring(1, { damping: 15 }));

    descOpacity.value = withDelay(1600, withTiming(1, { duration: 800 }));

    buttonOpacity.value = withDelay(2000, withTiming(1, { duration: 700 }));
    buttonTranslateY.value = withDelay(2000, withSpring(0, { damping: 18 }));

    cornerOpacity.value = withDelay(2200, withTiming(1, { duration: 600 }));
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateX: tagTranslateX.value }],
  }));

  const orbitalContainerStyle = useAnimatedStyle(() => ({
    opacity: orbitalOpacity.value,
    transform: [{ scale: orbitalScale.value }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerOpacity.value,
  }));

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <ScanLineContext.Provider value={scanLineY}>
      <View style={styles.container}>
        {/* Background */}
        <View style={styles.background}>
          <LinearGradient
            colors={["#0a0a0a", "#000000", "#050505"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Scan line effect */}
        <ScanLine scanLineY={scanLineY} />

        {/* Corner decorations */}
        <Animated.View style={[styles.cornerTL, cornerStyle]}>
          <View style={styles.cornerLineH} />
          <View style={styles.cornerLineV} />
        </Animated.View>
        <Animated.View style={[styles.cornerTR, cornerStyle]}>
          <View style={[styles.cornerLineH, { alignSelf: "flex-end" }]} />
          <View style={[styles.cornerLineV, { alignSelf: "flex-end" }]} />
        </Animated.View>
        <Animated.View style={[styles.cornerBL, cornerStyle]}>
          <View style={styles.cornerLineV} />
          <View style={styles.cornerLineH} />
        </Animated.View>
        <Animated.View style={[styles.cornerBR, cornerStyle]}>
          <View style={[styles.cornerLineV, { alignSelf: "flex-end" }]} />
          <View style={[styles.cornerLineH, { alignSelf: "flex-end" }]} />
        </Animated.View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Top section with tag */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.tagContainer, tagStyle]}>
              <GlitchView
                elementY={tagY}
                elementHeight={30}
                style={styles.tagInner}
              >
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>AI MUSIC PLATFORM</Text>
              </GlitchView>
            </Animated.View>
          </View>

          {/* Center hero section */}
          <View style={styles.heroSection}>
            {/* Orbital visualization */}
            <Animated.View
              style={[styles.orbitalContainer, orbitalContainerStyle]}
            >
              <RotatingRing
                size={180}
                strokeWidth={1}
                speed={20000}
                direction={1}
                delay={700}
                elementY={orbitalY}
              />
              <RotatingRing
                size={240}
                strokeWidth={1}
                speed={30000}
                direction={-1}
                delay={900}
                elementY={orbitalY}
              />

              {orbitals.map((orbital, index) => (
                <OrbitalDot key={index} {...orbital} />
              ))}

              {/* Center pulse */}
              <GlitchView
                elementY={orbitalY + 100}
                elementHeight={50}
                style={styles.centerCore}
              >
                <View style={styles.centerDot} />
              </GlitchView>
            </Animated.View>

            {/* Title with animated letters */}
            <Animated.View style={[styles.titleContainer, heroStyle]}>
              <View style={styles.titleRow}>
                {titleLetters.map((letter, index) => (
                  <AnimatedLetter
                    key={index}
                    letter={letter}
                    index={index}
                    totalLetters={titleLetters.length}
                    baseY={titleY}
                  />
                ))}
              </View>
              <StaticNoise elementY={titleY} elementHeight={50} />
            </Animated.View>

            {/* Subtitle */}
            <Animated.View style={descStyle}>
              <GlitchText
                style={styles.heroSubtitle}
                elementY={subtitleY}
                elementHeight={50}
              >
                Where artificial intelligence{"\n"}meets musical creativity
              </GlitchText>
            </Animated.View>
          </View>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            {/* Features row */}
            <Animated.View style={[styles.featuresRow, descStyle]}>
              <GlitchView
                elementY={featuresY}
                elementHeight={40}
                style={styles.featuresInner}
              >
                <View style={styles.featureItem}>
                  <Text style={styles.featureNumber}>01</Text>
                  <Text style={styles.featureLabel}>CREATE</Text>
                </View>
                <View style={styles.featureDivider} />
                <View style={styles.featureItem}>
                  <Text style={styles.featureNumber}>02</Text>
                  <Text style={styles.featureLabel}>SHARE</Text>
                </View>
                <View style={styles.featureDivider} />
                <View style={styles.featureItem}>
                  <Text style={styles.featureNumber}>03</Text>
                  <Text style={styles.featureLabel}>DISCOVER</Text>
                </View>
              </GlitchView>
            </Animated.View>

            {/* CTA Button */}
            <Animated.View style={buttonStyle}>
              <GlitchView elementY={buttonY} elementHeight={50}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => navigation.replace("Auth")}
                >
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>ENTER</Text>
                    <View style={styles.buttonLine} />
                    <Text style={styles.buttonArrow}>↗</Text>
                  </View>
                </Pressable>
              </GlitchView>
            </Animated.View>

            {/* Version tag */}
            <Animated.View style={[styles.versionContainer, cornerStyle]}>
              <Text style={styles.versionText}>V1.0</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </ScanLineContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  scanLineContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 40,
    alignItems: "center",
    zIndex: 100,
  },
  scanLineMain: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 19,
    height: 2,
    backgroundColor: "#ffffff",
  },
  scanLineGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  staticNoise: {
    position: "absolute",
    left: -10,
    right: -10,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  noiseLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  cornerTL: {
    position: "absolute",
    top: 50,
    left: 24,
  },
  cornerTR: {
    position: "absolute",
    top: 50,
    right: 24,
  },
  cornerBL: {
    position: "absolute",
    bottom: 50,
    left: 24,
  },
  cornerBR: {
    position: "absolute",
    bottom: 50,
    right: 24,
  },
  cornerLineH: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  cornerLineV: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "flex-start",
  },
  tagContainer: {
    overflow: "visible",
  },
  tagInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  tagText: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 3,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbitalContainer: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  rotatingRing: {
    position: "absolute",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderStyle: "dashed",
  },
  ringAccent: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  orbitalDot: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
  centerCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  titleContainer: {
    marginBottom: 20,
    overflow: "visible",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  titleLetter: {
    fontFamily: "Syne_800ExtraBold",
    fontSize: Math.min(38, SCREEN_WIDTH / 11),
    color: "#ffffff",
    letterSpacing: SCREEN_WIDTH > 400 ? 4 : 2,
  },
  heroSubtitle: {
    fontFamily: "SpaceGrotesk_300Light",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomSection: {
    alignItems: "center",
    gap: 28,
  },
  featuresRow: {
    overflow: "visible",
  },
  featuresInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureItem: {
    alignItems: "center",
    gap: 4,
  },
  featureNumber: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.3)",
    letterSpacing: 1,
  },
  featureLabel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 2,
  },
  featureDivider: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  button: {
    borderWidth: 1,
    borderColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonPressed: {
    backgroundColor: "#ffffff",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  buttonText: {
    fontFamily: "Syne_700Bold",
    fontSize: 13,
    color: "#ffffff",
    letterSpacing: 4,
  },
  buttonLine: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  buttonArrow: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 16,
    color: "#ffffff",
  },
  versionContainer: {
    marginTop: 8,
  },
  versionText: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.2)",
    letterSpacing: 2,
  },
});
