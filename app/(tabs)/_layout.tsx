import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { AdBanner } from '@/components/AdBanner';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const themeColor = useSettingsStore((s) => s.themeColor);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
          // 分頁列下方接了 AdBanner，不是螢幕最底部，所以固定高度不用另外加安全區。
          tabBarStyle: {
            backgroundColor: themeColor,
            borderTopWidth: 0,
            borderTopColor: 'transparent',
            elevation: 0,       // 消除 Android shadow（灰線來源）
            shadowOpacity: 0,   // 消除 iOS shadow
            height: 56,
            paddingBottom: 0,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="current"
          options={{
            title: '目前身材',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={'person' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wall"
          options={{
            title: '照片牆',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={'grid' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="comparison"
          options={{
            title: '身型對比',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={'git-compare-outline' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <AdBanner />
    </View>
  );
}
