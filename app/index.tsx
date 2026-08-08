import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SettingsSheet } from '@/components/SettingsSheet';
import { AdBanner } from '@/components/AdBanner';
import { useSettingsStore } from '@/stores/settingsStore';

export default function WelcomeScreen() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const {
    openCameraOnLaunch, triggerCameraOpen,
    loaded, hasAutoLaunched, markAutoLaunched,
  } = useSettingsStore();

  // 若設定「開啟時直接用相機打開」，只在冷啟動時觸發一次（hasAutoLaunched 防重複）
  useEffect(() => {
    if (!loaded) return;
    if (openCameraOnLaunch && !hasAutoLaunched) {
      markAutoLaunched();
      triggerCameraOpen();
      router.replace('/(tabs)/current');
    }
  }, [loaded]);

  // 淡入動畫
  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(24)).current;
  const footFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(heroFade,  { toValue: 1, duration: 760, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 760, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(footFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.root}>
      {/* 上方留白 */}
      <View style={s.topSpace} />

      {/* 主視覺標題區 */}
      <Animated.View style={[s.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
        <Text style={s.title}>SPARK SHAPE</Text>
        <Text style={s.subtitle}>拍下每一刻的自己，我要見證我的蛻變</Text>
      </Animated.View>

      {/* 中間留白 */}
      <View style={s.midSpace} />

      {/* 底部操作區 */}
      <Animated.View style={[s.footer, { opacity: footFade }]}>
        {/* 設定 */}
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.6}
        >
          <Text style={s.settingsLabel}>設定</Text>
        </TouchableOpacity>

        {/* 開始使用 */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.replace('/(tabs)/current')}
          activeOpacity={0.82}
        >
          <Text style={s.ctaText}>開始使用</Text>
        </TouchableOpacity>
      </Animated.View>

      <AdBanner />

      {/* 設定面板 */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EAAFB3' },
  topSpace: { flex: 0.5 },
  midSpace:  { flex: 0.5 },

  hero: { alignItems: 'center', paddingHorizontal: 36 },
  title: {
    fontSize: 36,             // 稍大，與參考圖一致
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 32,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,             // 稍大
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 22,
    fontWeight: '400',
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 14,
  },
  settingsBtn: {
    height: 40,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  settingsLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontWeight: '500',
  },

  ctaBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F0',
    shadowColor: '#D09089',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    color: '#EAAFB3',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 2,
  },
});
