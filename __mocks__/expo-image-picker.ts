export const launchImageLibraryAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: '/mock/chosen.jpg', width: 900, height: 1200 }],
});
export const launchCameraAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: '/mock/camera.jpg', width: 900, height: 1200 }],
});
export const MediaTypeOptions = { Images: 'Images' } as const;
export const useMediaLibraryPermissions = jest.fn().mockReturnValue([
  { granted: true },
  jest.fn(),
]);
