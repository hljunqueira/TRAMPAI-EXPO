import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  onHide: () => void;
}

export function TrampaISplash({ onHide }: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHide();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const clockwiseSpin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const counterSpin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: opacityValue }]}>
      <Animated.View style={{ transform: [{ scale: scaleValue }], alignItems: "center" }}>
        <Text style={styles.title}>Trampaí</Text>
        <Text style={styles.slogan}>
          Faz tua grana, no teu tempo, do teu jeito.
        </Text>

        <View style={styles.gearsRow}>
          <Animated.View style={{ transform: [{ rotate: clockwiseSpin }] }}>
            <MaterialCommunityIcons name="cog" size={64} color="#F69926" />
          </Animated.View>
          <Animated.View
            style={{ transform: [{ rotate: counterSpin }], marginLeft: -10 }}
          >
            <MaterialCommunityIcons name="cog" size={64} color="#5EB4B8" />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#21284E",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    paddingTop: Platform.OS === "web" ? 67 : 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 8,
  },
  slogan: {
    color: "#F7EFCF",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 36,
    paddingHorizontal: 32,
  },
  gearsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
