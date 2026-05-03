import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  id: string;
  bgColors: [string, string];
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
  features?: string[];
}

const SLIDES: Slide[] = [
  {
    id: "intro",
    bgColors: ["#21284E", "#2d3a6e"],
    icon: "cog",
    iconColor: "#F69926",
    title: "Bem-vindo ao Trampaí!",
    subtitle: "Serviços locais, do jeito certo",
    description:
      "O marketplace que conecta quem precisa de ajuda com quem faz acontecer.",
  },
  {
    id: "client",
    bgColors: ["#5EB4B8", "#3a9aa0"],
    icon: "account-search-outline",
    iconColor: "#fff",
    title: "Precisa de ajuda?",
    subtitle: "Encontre profissionais perto de você",
    description:
      "Publique o que você precisa e receba contatos de prestadores no momento certo.",
    features: [
      "Publicação gratuita",
      "Profissionais verificados",
      "Contato direto pelo WhatsApp",
    ],
  },
  {
    id: "provider",
    bgColors: ["#F69926", "#c97a15"],
    icon: "briefcase-outline",
    iconColor: "#fff",
    title: "Quer trabalhar mais?",
    subtitle: "Monte sua carteira de clientes",
    description:
      "Encontre clientes que precisam exatamente do que você faz, na sua região de atuação.",
    features: [
      "Acesse leads qualificados",
      "Pague só pelo que desbloquear",
      "Ganhe visibilidade na sua região",
    ],
  },
  {
    id: "both",
    bgColors: ["#21284E", "#1a1d3a"],
    icon: "account-switch-outline",
    iconColor: "#5EB4B8",
    title: "Você decide!",
    subtitle: "Um perfil, duas possibilidades",
    description:
      "Seja cliente quando precisar e prestador quando quiser. Troque de modo a qualquer momento, sem criar outra conta.",
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isLast = currentIndex === SLIDES.length - 1;

  async function handleStart() {
    await AsyncStorage.setItem("@trampai/welcomeSeen", "true");
    router.replace("/login");
  }

  function goToSlide(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      flatListRef.current?.scrollToIndex({ index, animated: false });
      setCurrentIndex(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }

  function handleNext() {
    if (isLast) {
      handleStart();
    } else {
      goToSlide(currentIndex + 1);
    }
  }

  function handleSkip() {
    handleStart();
  }

  const slide = SLIDES[currentIndex];

  return (
    <LinearGradient
      colors={slide.bgColors}
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View style={{ width: SCREEN_WIDTH }} />}
        style={{ height: 0 }}
      />

      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}> 
        <View style={styles.iconWrapper}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  slide.id === "intro" || slide.id === "both"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.2)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={slide.icon as never}
              size={72}
              color={slide.iconColor}
            />
          </View>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text
          style={[
            styles.subtitle,
            {
              color:
                slide.id === "intro" || slide.id === "both"
                  ? "#F69926"
                  : "rgba(255,255,255,0.85)",
            },
          ]}
        >
          {slide.subtitle}
        </Text>
        <Text style={styles.description}>{slide.description}</Text>

        {slide.features && (
          <View style={styles.featuresList}>
            {slide.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {slide.id === "both" && (
          <View style={styles.bothBadge}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="#F69926" />
            <Text style={styles.bothBadgeText}>
              Crie sua conta e comece agora — é gratuito
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: i === currentIndex ? 22 : 8,
                    backgroundColor:
                      i === currentIndex ? "#fff" : "rgba(255,255,255,0.35)",
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: isLast ? "#F69926" : "rgba(255,255,255,0.18)",
              borderColor: isLast ? "#F69926" : "rgba(255,255,255,0.3)",
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.nextBtnText,
              { fontWeight: isLast ? "700" : "600" },
            ]}
          >
            {isLast ? "Começar agora" : "Próximo"}
          </Text>
          <MaterialCommunityIcons
            name={isLast ? "arrow-right-circle" : "arrow-right"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  skipBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrapper: {
    marginBottom: 8,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: -4,
  },
  description: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  featuresList: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  bothBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(246,153,38,0.15)",
    borderColor: "rgba(246,153,38,0.3)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  bothBadgeText: {
    color: "#F7EFCF",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    gap: 20,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});