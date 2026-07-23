import { View, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsPro } from '@/hooks/useIsPro';
import { AdBanner } from '@/components/AdBanner';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const TAB_BAR_BASE_HEIGHT = 48;

// 自訂 tabBar：react-navigation 的 tabBarStyle.height 在這個專案裡不會被完全遵守
// （量測發現實際渲染仍會多墊出安全區高度），改用完全自繪的列來鎖死固定高度。
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const themeColor = useSettingsStore((s) => s.themeColor);
  const isPro = useIsPro();
  const insets = useSafeAreaInsets();
  // 有廣告時分頁列下方接的是 AdBanner，不用留安全區；沒有廣告（Android 全部、iOS Pro）
  // 時分頁列才是螢幕真正的底部，要補回安全區高度。
  const bottomInset = isPro ? insets.bottom : 0;

  return (
    <View style={{ flexDirection: 'row', height: TAB_BAR_BASE_HEIGHT + bottomInset, paddingBottom: bottomInset, backgroundColor: themeColor }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tintColor = isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.5)';
        const label = typeof options.title === 'string' ? options.title : route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {options.tabBarIcon?.({ focused: isFocused, color: tintColor, size: 20 })}
            <Text style={{ fontSize: 10, fontWeight: '600', marginTop: 2, color: tintColor }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
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
