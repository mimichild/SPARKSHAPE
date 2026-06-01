import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
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
