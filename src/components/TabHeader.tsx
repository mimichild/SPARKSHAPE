import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  title: string;
}

export function TabHeader({ title }: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);

  return (
    <View style={[s.row, { backgroundColor: themeColor }]}>
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => router.replace('/')}
        activeOpacity={0.6}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 16 }}
      >
        <Ionicons name={'chevron-back' as IoniconsName} size={18} color="rgba(255,255,255,0.9)" />
        <Text style={s.backText}>返回</Text>
      </TouchableOpacity>

      <Text style={s.title}>{title}</Text>

      <View style={s.placeholder} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 64,
    gap: 2,
  },
  backText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: { width: 64 },
});
