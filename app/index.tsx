import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SettingsSheet } from '@/components/SettingsSheet';
import { useSettingsStore } from '@/stores/settingsStore';

export default function WelcomeScreen() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const {
    themeColor, openCameraOnLaunch, triggerCameraOpen,
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
        <Text style={[s.title, { color: themeColor }]}>SPARK SHAPE</Text>
        <Text style={s.subtitle}>拍下每一刻的自己，我要見證我的蛻變</Text>
      </Animated.View>

      {/* 中間留白 */}
      <View style={s.midSpace} />

      {/* 底部操作區 */}
      <Animated.View style={[s.footer, { opacity: footFade }]}>
        {/* 設定 */}
        <TouchableOpacity
          style={s.settingsRow}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.6}
        >
          <Text style={s.snowIcon}>✳</Text>
          <Text style={s.settingsLabel}> 設定</Text>
        </TouchableOpacity>

        {/* 系列 App 連結 */}
        <View style={s.appsRow}>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={s.appLink}>SPARK PLATE</Text>
          </TouchableOpacity>
          <View style={s.appLinkGap} />
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={s.appLink}>SPARK FIT</Text>
          </TouchableOpacity>
        </View>

        {/* 開始使用 */}
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: themeColor }]}
          onPress={() => router.replace('/(tabs)/current')}
          activeOpacity={0.82}
        >
          <Text style={s.ctaText}>開始使用</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 設定面板 */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topSpace: { flex: 1.8 },
  midSpace:  { flex: 2.2 },

  hero: { alignItems: 'center', paddingHorizontal: 36 },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 21,
    fontWeight: '400',
  },

  footer: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center' },
  snowIcon: { fontSize: 15, color: '#9DC0D0', lineHeight: 20 },
  settingsLabel: {
    fontSize: 13,
    color: '#AAAAAA',
    letterSpacing: 1.5,
    fontWeight: '300',
  },

  appsRow: { flexDirection: 'row', alignItems: 'center' },
  appLink: {
    fontSize: 11,
    color: '#AAAAAA',
    letterSpacing: 2,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  appLinkGap: { width: 40 },

  ctaBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D09089',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 2,
  },
});
