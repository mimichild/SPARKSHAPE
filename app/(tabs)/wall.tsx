import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useFocusEffect } from 'expo-router';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useSettingsStore } from '@/stores/settingsStore';
import { deleteBodyPhotoFiles } from '@/services/photoStorageService';
import { BodyPhotoCard } from '@/components/BodyPhotoCard';
import { PhotoPreviewModal } from '@/components/PhotoPreviewModal';
import { TabHeader } from '@/components/TabHeader';
import type { BodyPhoto, PhotoType } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export default function PhotoWallScreen() {
  const { photos, loading, removePhoto, reload } = useBodyPhotos('desc');
  const [preview,     setPreview]     = useState<BodyPhoto | null>(null);
  const [filter,      setFilter]      = useState<PhotoType>('front');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 切換到此 Tab 時重新載入，確保顯示最新照片
  useFocusEffect(
    useCallback(() => { reload(); }, [reload]),
  );

  const swipeHandlers = useSwipeBack();
  const themeColor    = useSettingsStore((s) => s.themeColor);

  const filtered = photos.filter((p) => p.photoType === filter);

  // ── 選取邏輯 ──────────────────────────────────────────────────────────────

  function handleLongPress(photo: BodyPhoto) {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedIds(new Set([photo.id]));
    }
  }

  function handlePress(photo: BodyPhoto) {
    if (isSelecting) {
      // 切換選取
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(photo.id)) next.delete(photo.id);
        else next.add(photo.id);
        return next;
      });
    } else {
      setPreview(photo);
    }
  }

  function cancelSelection() {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }

  function confirmDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert(
      '確認刪除',
      `確定要刪除這 ${count} 張照片嗎？\n此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: `刪除 ${count} 張`,
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedIds) {
              await removePhoto(id);
              deleteBodyPhotoFiles(id).catch(() => {});
            }
            cancelSelection();
          },
        },
      ],
    );
  }

  // ── 右上角正面／側面切換 ─────────────────────────────────────────────────

  const Toggle = (
    <View style={ts.toggle}>
      {(['front', 'side'] as PhotoType[]).map((t) => (
        <TouchableOpacity
          key={t}
          style={[ts.btn, filter === t && ts.btnActive]}
          onPress={() => { setFilter(t); cancelSelection(); }}
          activeOpacity={0.75}
        >
          <Text style={[ts.btnText, filter === t && { color: themeColor }]}>
            {t === 'front' ? '正面' : '側面'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const isEmpty = !loading && filtered.length === 0;

  return (
    <SafeAreaView style={styles.container} {...swipeHandlers}>
      <TabHeader title={isSelecting ? `已選 ${selectedIds.size} 張` : '照片牆'} rightComponent={Toggle} />

      {isEmpty ? (
        <View style={styles.emptyContainer} testID="empty-wall">
          <Ionicons name={'images-outline' as IoniconsName} size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            還沒有{filter === 'front' ? '正面' : '側面'}照片
          </Text>
          <Text style={styles.emptySubtitle}>去目前身材頁拍第一張吧！</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <BodyPhotoCard
              photo={item}
              onPress={handlePress}
              onLongPress={handleLongPress}
              isSelecting={isSelecting}
              isSelected={selectedIds.has(item.id)}
            />
          )}
        />
      )}

      {/* 底部工具列（選取中才顯示） */}
      {isSelecting && (
        <View style={[toolbar.bar, { backgroundColor: themeColor }]}>
          <TouchableOpacity style={toolbar.cancelBtn} onPress={cancelSelection}>
            <Text style={toolbar.cancelText}>取消</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[toolbar.deleteBtn, selectedIds.size === 0 && toolbar.deleteBtnDisabled]}
            onPress={confirmDelete}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name={'trash-outline' as IoniconsName} size={16} color={themeColor} />
            <Text style={[toolbar.deleteText, { color: themeColor }]}>
              {selectedIds.size > 0 ? `刪除 ${selectedIds.size} 張` : '刪除'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <PhotoPreviewModal photo={preview} onClose={() => setPreview(null)} />
    </SafeAreaView>
  );
}

// ── 切換按鈕 ──────────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  btn:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  btnActive: { backgroundColor: '#FFFFFF' },
  btnText: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3,
  },
});

// ── 底部工具列 ────────────────────────────────────────────────────────────
const toolbar = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  cancelBtn:  { paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deleteBtnDisabled: { opacity: 0.45 },
  deleteText: { fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  emptyText:     { color: '#333333', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#888888', fontSize: 14 },
});
