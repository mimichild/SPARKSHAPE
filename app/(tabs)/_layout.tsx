import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const themeColor = useSettingsStore((s) => s.themeColor);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: themeColor,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,       // 消除 Android shadow（灰線來源）
          shadowOpacity: 0,   // 消除 iOS shadow
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
  );
}
