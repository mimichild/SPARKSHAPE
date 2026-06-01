export const CameraView = 'CameraView';
export const useCameraPermissions = jest.fn().mockReturnValue([
  { granted: true },
  jest.fn(),
]);
export const CameraType = { back: 'back', front: 'front' } as const;
